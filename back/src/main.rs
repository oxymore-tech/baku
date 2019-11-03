use futures::{future, Future};
use serde::Deserialize;
use serde_json::from_str;
use std::{
    collections::HashMap,
    path::Path,
    str,
    sync::{
        atomic::{AtomicUsize, Ordering},
        Arc, Mutex,
    },
};
use tokio::{
    fs::{create_dir_all, rename, File},
    prelude::*,
    sync::mpsc,
};

use tokio_executor::blocking;
use uuid::Uuid;
use warp::{ws::Message, ws::WebSocket, Filter};

#[derive(Deserialize)]
struct Size {
    width: u32,
    height: u32,
}

#[derive(Deserialize)]
struct WSMessage {
    action: String,
    // value: String,
    socketid: usize,
}

/// Our global unique user id counter.
static NEXT_USER_ID: AtomicUsize = AtomicUsize::new(1);

/// Our state of currently connected users.
///
/// - Key is their id
/// - Value is a sender of `warp::ws::Message`
type Users = Arc<Mutex<HashMap<usize, mpsc::UnboundedSender<Result<Message, warp::Error>>>>>;
type Links = Arc<Mutex<HashMap<usize, usize>>>;

async fn handle_multipart(
    project_id: String,
    mut form: warp::multipart::FormData,
) -> Result<Vec<Uuid>, warp::Rejection> {
    let img_directory = Path::new("upload_files");

    let mut uuids = Vec::new();

    while let Some(part) = form.next().await {
        let part = part.map_err(warp::reject::custom)?;

        let uuid = Uuid::new_v4();
        let filename = format!("{}.jpg", uuid.to_string());
        let image_path = Path::join(
            img_directory,
            Path::join(Path::new(&project_id), Path::new(&filename)),
        );

        let image_buffer = part.concat().await;

        create_dir_all(image_path.parent().unwrap())
            .await
            .map_err(warp::reject::custom)?;
        let mut image_file = File::create(image_path)
            .await
            .map_err(warp::reject::custom)?;
        image_file
            .write_all(&image_buffer)
            .await
            .map_err(warp::reject::custom)?;
        image_file.sync_data().await.map_err(warp::reject::custom)?;

        uuids.push(uuid);
    }

    Ok(uuids)
}

async fn handle_get_images(
    project_id: String,
    filename: String,
    r: Size,
) -> Result<Vec<u8>, warp::Rejection> {
    let thumbs_directory = Path::new("upload_thumbs");
    let thumb_filename = format!("{}-{}x{}", filename, r.width, r.height);
    let thumbnail_path = Path::join(
        thumbs_directory,
        Path::join(Path::new(&project_id), Path::new(&thumb_filename)),
    );

    let mut thumbnail_buffer = Vec::new();

    if thumbnail_path.exists() {
        let mut f = File::open(&thumbnail_path)
            .await
            .map_err(warp::reject::custom)?;
        f.read_to_end(&mut thumbnail_buffer)
            .await
            .map_err(warp::reject::custom)?;
    } else {
        let img_directory = Path::new("upload_files");
        let image_path = Path::join(
            img_directory,
            Path::join(Path::new(&project_id), Path::new(&filename)),
        );
        let image = image::open(&image_path).map_err(warp::reject::custom)?;

        println!("Resizing {}", filename);
        let thumbnail = blocking::run(move || {
            image.resize(r.width, r.height, image::imageops::FilterType::Lanczos3)
        })
        .await;
        println!("Done {}", filename);

        thumbnail
            .write_to(&mut thumbnail_buffer, image::ImageOutputFormat::JPEG(200))
            .map_err(warp::reject::custom)?;

        let uuid = Uuid::new_v4();
        let temp_filename = format!("{}.jpg", uuid.to_string());
        let temp_path = Path::join(thumbs_directory, Path::new(&temp_filename));

        println!("Writing to {}", temp_filename);
        create_dir_all(temp_path.parent().unwrap())
            .await
            .map_err(warp::reject::custom)?;
        let mut thumb_file = File::create(&temp_path)
            .await
            .map_err(warp::reject::custom)?;
        thumb_file
            .write_all(&thumbnail_buffer)
            .await
            .map_err(warp::reject::custom)?;
        thumb_file.sync_data().await.map_err(warp::reject::custom)?;
        println!("Renaming to {}", thumb_filename);
        create_dir_all(thumbnail_path.parent().unwrap())
            .await
            .map_err(warp::reject::custom)?;
        rename(temp_path, thumbnail_path).await.unwrap();
        println!("Done {}", thumb_filename);

        let mut thumbnail_buffer = Vec::new();

        thumbnail
            .write_to(&mut thumbnail_buffer, image::ImageOutputFormat::JPEG(200))
            .map_err(warp::reject::custom)?;
    }

    Ok(thumbnail_buffer)
}

async fn handle_stack(project_id: String, body: String) -> Result<(), warp::Rejection> {
    let stack_directory = Path::new("stacks");
    let stack_path = Path::join(stack_directory, Path::new(&format!("{}.stack", project_id)));
    create_dir_all(stack_path.parent().unwrap())
        .await
        .map_err(warp::reject::custom)?;

    let mut json: Vec<String>;

    if stack_path.exists() {
        let mut buffer = Vec::new();
        let mut f = File::open(&stack_path)
            .await
            .map_err(warp::reject::custom)?;
        f.read_to_end(&mut buffer)
            .await
            .map_err(warp::reject::custom)?;

        let s = match str::from_utf8(&buffer) {
            Ok(v) => v,
            Err(e) => panic!("Invalid UTF-8 sequence: {}", e),
        };

        println!("{}: Stacking {}", project_id, body);

        json = from_str(s).map_err(warp::reject::custom)?;
    } else {
        json = Vec::new();
    }
    json.push(body);

    let json_as_string = serde_json::to_string(&json).unwrap();

    //TODO concurrency
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

async fn handle_history(project_id: String) -> Result<Vec<String>, warp::Rejection> {
    let stack_directory = Path::new("stacks");
    let stack_path = Path::join(stack_directory, Path::new(&format!("{}.stack", project_id)));

    if stack_path.exists() {
        let mut buffer = Vec::new();
        let mut f = File::open(&stack_path)
            .await
            .map_err(warp::reject::custom)?;
        f.read_to_end(&mut buffer)
            .await
            .map_err(warp::reject::custom)?;

        let s = match str::from_utf8(&buffer) {
            Ok(v) => v,
            Err(e) => panic!("Invalid UTF-8 sequence: {}", e),
        };

        Ok(from_str(s).map_err(warp::reject::custom)?)
    } else {
        Ok(Vec::new())
    }
}

fn user_connected(
    ws: WebSocket,
    users: Users,
    links: Links,
) -> impl Future<Output = Result<(), ()>> {
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
        .then(move |result| {
            user_disconnected(my_id, &users2);
            future::ok(result)
        })
    // If at any time, there was a websocket error, log here...
    // .map_err(move |e| {
    //     eprintln!("websocket error(uid={}): {}", my_id, e);
    // })
}

fn user_message(my_id: usize, msg: Message, users: &Users, links: &Links) {
    println!("<User#{}>: {:#?}", my_id, msg);
    // Skip any non-Text messages...
    let msg = if let Ok(s) = msg.to_str() {
        s
    } else {
        return;
    };

    let msg: WSMessage = from_str(msg).unwrap();

    let new_msg = format!("<User#{}>: {:#?}", my_id, msg.action);
    if msg.action == "link" {
        links.lock().unwrap().insert(my_id, msg.socketid);
        links.lock().unwrap().insert(msg.socketid, my_id);
    } else {
        // New message from this user, send it to everyone else (except same uid)...
        //
        // We use `retain` instead of a for loop so that we can reap any user that
        // appears to have disconnected.
        let dest_id = links.lock().unwrap().get(&my_id).unwrap().clone();
        let mut dest_tx = users.lock().unwrap().get(&dest_id).unwrap().clone();

        match dest_tx.try_send(Ok(Message::text(new_msg.clone()))) {
            Ok(()) => (),
            Err(_disconnected) => {
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

    // Keep track of all connected users, key is usize, value
    // is a websocket sender.
    let users = Arc::new(Mutex::new(HashMap::new()));
    let links = Arc::new(Mutex::new(HashMap::new()));
    // Turn our "state" into a new Filter...
    let users = warp::any().map(move || users.clone());
    let links = warp::any().map(move || links.clone());

    let hi = warp::get2().and(warp::path("hi").map(|| "Hello, World!"));

    let multipart = warp::post2()
        .and(warp::path::param())
        .and(warp::path("upload"))
        .and(warp::multipart::form())
        .and_then(handle_multipart)
        .map(|uuids| warp::reply::json(&uuids));

    let route = warp::path("echo")
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

    let get = warp::get2()
        .and(warp::path::param())
        .and(warp::path("images"))
        .and(warp::path::param())
        .and(warp::query())
        .and_then(handle_get_images)
        .map(|buffer| {
            warp::http::Response::builder()
                .header("Content-Type", "image/jpg")
                .body(buffer)
        });

    let stack = warp::post2()
        .and(warp::path::param())
        .and(warp::path("stack"))
        .and(warp::body::json())
        .and_then(handle_stack)
        .map(|_| "Stacked");
    let history = warp::get2()
        .and(warp::path::param())
        .and_then(handle_history)
        .map(|history| warp::reply::json(&history));

    let routes = hi
        .or(route)
        .or(stack)
        .or(history)
        .or(get)
        .or(multipart)
        .or(warp::fs::dir("res"));

    warp::serve(routes).run(([127, 0, 0, 1], 3030)).await;
}
