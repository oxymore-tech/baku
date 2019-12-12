use std::{
    collections::HashMap,
    path::Path,
    str,
    sync::{
        Arc,
        atomic::{AtomicUsize, Ordering}, Mutex,
    },
};
use std::env;

use futures::{future, Future};
use serde::{Deserialize, Serialize};
use serde_json::from_str;
use tokio::{
    // fs::{create_dir_all, rename, File},
    fs::{create_dir_all, File},
    prelude::*,
    sync::mpsc,
};
use tokio_executor::blocking;
use uuid::Uuid;
use warp::{Filter, ws::Message, ws::WebSocket};

#[derive(Deserialize)]
struct Size {
    width: u32,
    height: u32,
}

struct Quality {
    size: Size,
    jpg_quality: u8,
    folder: String,
}
impl Quality {
    fn from(width: u32, height: u32, jpg_quality: u8, folder: &str) -> Quality {
        Quality {
            size: Size {
                width: width,
                height: height,
            },
            jpg_quality: jpg_quality,
            folder: String::from(folder),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
struct WSMessage {
    action: String,
    value: Option<serde_json::Value>,
}

/// Our global unique user id counter.
static NEXT_USER_ID: AtomicUsize = AtomicUsize::new(1);

/// Our state of currently connected users.
///
/// - Key is their id
/// - Value is a sender of `warp::ws::Message`
type Users = Arc<Mutex<HashMap<usize, mpsc::UnboundedSender<Result<Message, warp::Error>>>>>;
type Links = Arc<Mutex<HashMap<usize, usize>>>;

async fn save_resized_image(
    source_image: image::DynamicImage, quality: &Quality, project_directory: &Path, filename: &String,
) -> Result<(), std::io::Error> {
    let image_path = project_directory.join(&quality.folder).join(&filename);
    println!("Saving image to {}", &image_path.to_str().unwrap());

    let width = quality.size.width;
    let height = quality.size.height;
    let resized_image = blocking::run(move || {
        source_image.resize(width, height, image::imageops::FilterType::Lanczos3)
    }).await;

    let mut image_buffer = Vec::new();

    match resized_image
        .write_to(&mut image_buffer, image::ImageOutputFormat::JPEG(quality.jpg_quality)) {
            Ok(()) => {
            }
            Err(e) => {
                return Err(std::io::Error::new(std::io::ErrorKind::Other, e));
            }
        }

    create_dir_all(image_path.parent().unwrap())
        .await?;
    let mut image_file = File::create(image_path)
        .await?;
    image_file
        .write_all(&image_buffer)
        .await?;
    image_file.sync_data()
        .await?;

    Ok(())
}

async fn handle_multipart(
    project_id: String,
    mut form: warp::multipart::FormData,
) -> Result<Vec<String>, warp::Rejection> {
    let images_directory = Path::new("data/images/");

    let mut filenames = Vec::new();

    while let Some(part) = form.next().await {
        let part = part.map_err(warp::reject::custom)?;

        if let Some(_part_filename) = part.filename() {
            let filename = format!("{}.jpg", Uuid::new_v4().to_string());

            let image_buffer = part.concat().await;
            let source_image = image::load_from_memory(&image_buffer).map_err(warp::reject::custom)?;

            let project_directory = images_directory.join(&project_id);

            for quality in &vec![
                Quality::from(1280, 720, 100, "original"   ), // 720p
                Quality::from(1280, 720,  30, "lightweight"),
                Quality::from( 355, 200,  60, "thumbnail"  ),
            ] {
                save_resized_image(source_image.clone(), &quality, &project_directory, &filename).await.map_err(warp::reject::custom)?;
            }

            filenames.push(filename);
        }
    }

    Ok(filenames)
}

async fn handle_stack(
    global_lock: Arc<futures::lock::Mutex<usize>>,
    project_id: String,
    body: serde_json::Value,
) -> Result<(), warp::Rejection> {
    let stack_directory = Path::new("data/stacks");
    let stack_path = Path::join(stack_directory, Path::new(&format!("{}.stack", project_id)));
    create_dir_all(stack_path.parent().unwrap())
        .await
        .map_err(warp::reject::custom)?;

    let mut json: Vec<serde_json::Value>;

    if stack_path.exists() {
        let mut buffer = Vec::new();
        let mut f = File::open(&stack_path)
            .await
            .map_err(warp::reject::custom)?;
        f.read_to_end(&mut buffer)
            .await
            .map_err(warp::reject::custom)?;

        match str::from_utf8(&buffer) {
            Ok(s) => {
                json = from_str(s).map_err(warp::reject::custom)?;
            }
            Err(e) => {
                return Err(warp::reject::custom(e));
            }
        }

        //println!("{}: Stacking {}", project_id, body);
    } else {
        json = Vec::new();
    }
    json.push(body);

    let json_as_string = serde_json::to_string(&json).unwrap();

    let mut _lock = global_lock.lock();

    let mut written_file = File::create(&stack_path)
        .await
        .map_err(warp::reject::custom)?;
    written_file
        .write_all(&json_as_string.as_bytes())
        .await
        .map_err(warp::reject::custom)?;
    written_file
        .sync_data()
        .await
        .map_err(warp::reject::custom)?;

    Ok(())
}

async fn handle_history(project_id: String) -> Result<Vec<serde_json::Value>, warp::Rejection> {
    let stack_directory = Path::new("data/stacks");
    let stack_path = Path::join(stack_directory, Path::new(&format!("{}.stack", project_id)));

    if stack_path.exists() {
        let mut buffer = Vec::new();
        let mut f = File::open(&stack_path)
            .await
            .map_err(warp::reject::custom)?;
        f.read_to_end(&mut buffer)
            .await
            .map_err(warp::reject::custom)?;

        match str::from_utf8(&buffer) {
            Ok(s) => Ok(from_str(s).map_err(warp::reject::custom)?),
            Err(e) => Err(warp::reject::custom(e))
        }
    } else {
        Ok(Vec::new())
    }
}

fn user_connected(
    ws: WebSocket,
    users: Users,
    links: Links,
) -> impl Future<Output=Result<(), ()>> {
    // Use a counter to assign a new unique ID for this user.
    let my_id = NEXT_USER_ID.fetch_add(1, Ordering::Relaxed);

    eprintln!("new chat user: {}", my_id);

    // Split the socket into a sender and receive of messages.
    let (user_ws_tx, user_ws_rx) = ws.split();

    // Use an unbounded channel to handle buffering and flushing of messages
    // to the websocket...
    let (tx, rx) = mpsc::unbounded_channel();
    warp::spawn(rx.forward(user_ws_tx).map(|result| {
        if let Err(e) = result {
            eprintln!("websocket send error: {}", e);
        }
    }));

    // Save the sender in our list of connected users.
    users.lock().unwrap().insert(my_id, tx);

    // Return a `Future` that is basically a state machine managing
    // this specific user's connection.

    // Make an extra clone to give to our disconnection handler...
    let users2 = users.clone();

    user_ws_rx
        // Every time the user sends a message, broadcast it to
        // all other users...
        .for_each(move |msg| {
            user_message(my_id, msg.unwrap(), &users, &links);
            future::ready(())
        })
        // for_each will keep processing as long as the user stays
        // connected. Once they disconnect, then...
        .then(move |_result| {
            user_disconnected(my_id, &users2);
            future::ok(())
        })
    // If at any time, there was a websocket error, log here...
    // .map_err(move |e| {
    //     eprintln!("websocket error(uid={}): {}", my_id, e);
    // })
}

fn user_message(my_id: usize, original_msg: Message, users: &Users, links: &Links) {
    println!("<User#{}>: {:#?}", my_id, original_msg);

    let msg = if let Ok(s) = original_msg.to_str() {
        s
    } else {
        return;
    };

    let msg: WSMessage = from_str(msg).unwrap();

    if msg.action == "getSocketId" {
        // We get current user TX
        let mut dest_tx = users.lock().unwrap().get(&my_id).unwrap().clone();
        let new_msg: WSMessage = WSMessage {
            action: String::from("getSocketId"),
            value: Some(serde_json::from_str(&format!("{}", my_id)).unwrap()),
        };
        let new_msg = serde_json::to_string(&new_msg).unwrap();
        match dest_tx.try_send(Ok(Message::text(new_msg))) {
            Ok(()) => (println!("Message sent")),
            Err(_disconnected) => {
                println!("Message fail");
            }
        }
    } else if msg.action == "link" {
        let socket_id: usize = serde_json::from_value(msg.value.unwrap()).unwrap();

        println!("Link {} to {}", my_id, socket_id);
        links.lock().unwrap().insert(my_id, socket_id);
        links.lock().unwrap().insert(socket_id, my_id);

        let mut dest_tx = users.lock().unwrap().get(&socket_id).unwrap().clone();
        let new_msg: WSMessage = WSMessage {
            action: String::from("linkEstablished"),
            value: Some(serde_json::from_str(&format!("{}", my_id)).unwrap()),
        };
        let new_msg = serde_json::to_string(&new_msg).unwrap();
        match dest_tx.try_send(Ok(Message::text(new_msg))) {
            Ok(()) => (println!("Message sent")),
            Err(_disconnected) => {
                println!("Message fail");
            }
        }
    } else {
        // All other message just transit on this server
        let dest_id = match links.lock().unwrap().get(&my_id) {
            Some(v) => *v,
            None => my_id,
        };

        let mut dest_tx = users.lock().unwrap().get(&dest_id).unwrap().clone();

        match dest_tx.try_send(Ok(original_msg)) {
            Ok(()) => (println!("OK OK")),
            Err(_disconnected) => {
                println!("FAIL");
                // The tx is disconnected, our `user_disconnected` code
                // should be happening in another task, nothing more to
                // do here.
            }
        }
    }
}

fn user_disconnected(my_id: usize, users: &Users) {
    eprintln!("good bye user: {}", my_id);

    // Stream closed up, so remove from the user list
    users.lock().unwrap().remove(&my_id);
}

#[tokio::main]
async fn main() {
    let _ = pretty_env_logger::try_init();

    let args: Vec<String> = env::args().collect();
    let listening_port: u16;
    if args.len() < 2 {
        println!("*** Port should be specified in the command line ***");
        listening_port = 3030;
    } else {
        listening_port = args[1].parse().unwrap();
    }

    // Keep track of all connected users, key is usize, value
    // is a websocket sender.
    let users = Arc::new(Mutex::new(HashMap::new()));
    let links = Arc::new(Mutex::new(HashMap::new()));
    // Turn our "state" into a new Filter...
    let users = warp::any().map(move || users.clone());
    let links = warp::any().map(move || links.clone());

    let multipart = warp::post2()
        .and(warp::path("api"))
        .and(warp::path::param())
        .and(warp::path("upload"))
        .and(warp::multipart::form())
        .and_then(handle_multipart)
        .map(|filenames| warp::reply::json(&filenames));

    let echo = warp::path("echo")
        // The `ws2()` filter will prepare the Websocket handshake.
        .and(warp::ws2())
        .and(users)
        .and(links)
        .map(|ws: warp::ws::Ws2, users, links| {
            println!("Test {:#?}", ws);
            // And then our closure will be called when it completes...
            // This will call our function if the handshake succeeds.
            ws.on_upgrade(move |socket| {
                user_connected(socket, users, links).map(|result| result.unwrap())
            })
        });

    let global_lock = Arc::new(futures::lock::Mutex::new(0));

    let stack = warp::post2()
        .and(warp::path("api"))
        .and(warp::path::param())
        .and(warp::path("stack"))
        .and(warp::body::json())
        .and_then(move |project_id, body| handle_stack(global_lock.clone(), project_id, body))
        .map(|_| "Stacked");
    let history = warp::get2()
        .and(warp::path("api"))
        .and(warp::path::param())
        .and(warp::path("history"))
        .and_then(handle_history)
        .map(|history| warp::reply::json(&history));

    let routes = echo
        .or(stack)
        .or(history)
        .or(multipart);

    println!("Listening to port 0.0.0.0:{}", listening_port);
    warp::serve(routes)
        .run(([0, 0, 0, 0], listening_port))
        .await;
}
