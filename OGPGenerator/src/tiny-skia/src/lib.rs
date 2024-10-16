use wasm_bindgen::prelude::*;
use tiny_skia::{Pixmap, PremultipliedColorU8, Color};
use std::cell::RefCell;

// 画像データを保持するためのグローバル変数
thread_local! {
    static IMAGE_DATA: RefCell<Option<Vec<u8>>> = RefCell::new(None);
}

#[wasm_bindgen]
pub fn generate_image_with_offset(
    canvas_data_ptr: *const u8,
    canvas_data_len: usize,
    grid_size: usize,
    dot_size: u32,
    colors_ptr: *const u8,
    colors_len: usize,
    canvas_width: u32,
    canvas_height: u32,
    offset_x: u32,
    offset_y: u32,
) {
    // ポインタからスライスを作成
    let canvas_data = unsafe { std::slice::from_raw_parts(canvas_data_ptr, canvas_data_len) };
    let colors = unsafe { std::slice::from_raw_parts(colors_ptr, colors_len) };

    // Pixmapオブジェクトを生成
    let mut pixmap = Pixmap::new(canvas_width, canvas_height).expect("Failed to create pixmap");

    // 背景を白色で塗りつぶす
    pixmap.fill(Color::from_rgba8(255, 255, 255, 255));

    // ピクセル配列を取得
    let pixels = pixmap.pixels_mut();

    // グリッドデータを描画
    for j in 0..grid_size {
        for i in 0..grid_size {
            let index = canvas_data[j * grid_size + i] as usize;
            let color_start = index * 3;

            if color_start + 2 >= colors_len {
                continue; // カラー配列の範囲外を参照しないように
            }

            let r = colors[color_start];
            let g = colors[color_start + 1];
            let b = colors[color_start + 2];

            // PremultipliedColorU8を取得
            let premultiplied_color = PremultipliedColorU8::from_rgba(r, g, b, 255).unwrap();

            let x_start = offset_x + i as u32 * dot_size;
            let y_start = offset_y + j as u32 * dot_size;

            // 各ドットサイズに基づき、色を塗りつぶす
            for y in 0..dot_size {
                for x in 0..dot_size {
                    let px = x_start + x;
                    let py = y_start + y;
                    if px < canvas_width && py < canvas_height {
                        let pos = (py * canvas_width + px) as usize;
                        if pos < pixels.len() {
                            pixels[pos] = premultiplied_color;
                        }
                    }
                }
            }
        }
    }

    // PNGとしてエンコード
    let png_data = pixmap.encode_png().expect("Failed to encode image");

    // 画像データをグローバル変数に保存
    IMAGE_DATA.with(|data| {
        *data.borrow_mut() = Some(png_data);
    });
}

#[wasm_bindgen]
pub fn get_image_data(ptr: *mut u8, max_size: usize) -> usize {
    IMAGE_DATA.with(|data| {
        if let Some(ref png_data) = *data.borrow() {
            let len = png_data.len().min(max_size);
            unsafe {
                let dest = std::slice::from_raw_parts_mut(ptr, len);
                dest.copy_from_slice(&png_data[..len]);
            }
            len
        } else {
            0
        }
    })
}

#[wasm_bindgen]
pub fn get_image_size() -> usize {
    IMAGE_DATA.with(|data| {
        if let Some(ref png_data) = *data.borrow() {
            png_data.len()
        } else {
            0
        }
    })
}

#[wasm_bindgen]
pub fn alloc(size: usize) -> *mut u8 {
    let mut buf = Vec::with_capacity(size);
    let ptr = buf.as_mut_ptr();
    std::mem::forget(buf);
    ptr
}

#[wasm_bindgen]
pub fn dealloc(ptr: *mut u8, size: usize) {
    unsafe {
        Vec::from_raw_parts(ptr, 0, size);
    }
}
