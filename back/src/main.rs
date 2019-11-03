use std::path::Path;
use tokio_executor::blocking;
use tokio::fs::{create_dir_all, File, rename};
use tokio::prelude::*;
use warp::Filter;
use uuid::Uuid;
use serde::Deserialize;


#[derive(Deserialize)]
struct Size {
    width: u32,
    height: u32
}

async fn handle_multipart(project_id: String, mut form: warp::multipart::FormData) -> Result<Vec<Uuid>, warp::Rejection> {
    let img_directory = Path::new("upload_files");

    let mut uuids = Vec::new();

    while let Some(part) = form.next().await {
        let part = part.map_err(warp::reject::custom)?;
        
        let uuid = Uuid::new_v4();
        let filename = format!("{}.jpg", uuid.to_string());
        let image_path = Path::join(img_directory, Path::join(Path::new(&project_id), Path::new(&filename)));

        let image_buffer = part.concat().await;

        create_dir_all(image_path.parent().unwrap()).await.map_err(warp::reject::custom)?;
        let mut image_file = File::create(image_path)
            .await
            .map_err(warp::reject::custom)?;
        image_file.write_all(&image_buffer).await.map_err(warp::reject::custom)?;
        image_file.sync_data().await.map_err(warp::reject::custom)?;

        uuids.push(uuid);
    }

    Ok(uuids)
}


async fn handle_get_images(project_id: String, filename: String, r : Size) -> Result<Vec<u8>, warp::Rejection> {
    let thumbs_directory = Path::new("upload_thumbs");
    let thumb_filename = format!("{}-{}x{}", filename, r.width, r.height);
    let thumbnail_path = Path::join(thumbs_directory, Path::join(Path::new(&project_id), Path::new(&thumb_filename)));

    let mut thumbnail_buffer = Vec::new();

    if thumbnail_path.exists() {
        let mut f = File::open(&thumbnail_path).await.map_err(warp::reject::custom)?;
        f.read_to_end(&mut thumbnail_buffer).await.map_err(warp::reject::custom)?;
    } else {
        let img_directory = Path::new("upload_files");
        let image_path = Path::join(img_directory, Path::join(Path::new(&project_id), Path::new(&filename)));
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
        create_dir_all(temp_path.parent().unwrap()).await.map_err(warp::reject::custom)?;
        let mut thumb_file = File::create(&temp_path)
            .await
            .map_err(warp::reject::custom)?;
        thumb_file.write_all(&thumbnail_buffer).await.map_err(warp::reject::custom)?;
        thumb_file.sync_data().await.map_err(warp::reject::custom)?;
        println!("Renaming to {}", thumb_filename);
        create_dir_all(thumbnail_path.parent().unwrap()).await.map_err(warp::reject::custom)?;
        rename(temp_path, thumbnail_path).await.unwrap();
        println!("Done {}", thumb_filename);

        let mut thumbnail_buffer = Vec::new();

        thumbnail
            .write_to(&mut thumbnail_buffer, image::ImageOutputFormat::JPEG(200))
            .map_err(warp::reject::custom)?;
    }
    
    Ok(thumbnail_buffer)
}

#[tokio::main]
async fn main() {
    let _ = pretty_env_logger::try_init();

    let hi = warp::get2().and(warp::path("hi").map(|| "Hello, World!"));

    let multipart = warp::post2()
    .and(warp::path::param())
    .and(warp::path("upload"))
    .and(warp::multipart::form())
    .and_then(handle_multipart)
    .map(|uuids| warp::reply::json(&uuids));

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

    let routes = hi.or(get).or(multipart).or(warp::fs::dir("res"));

    warp::serve(routes).run(([127, 0, 0, 1], 3030)).await;
}
