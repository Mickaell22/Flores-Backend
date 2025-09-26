#!/usr/bin/env python3
"""
Script para mejorar el recorte de las imágenes de productos.
Elimina el fondo blanco/transparente y centra el objeto principal.
"""

import os
import cv2
import numpy as np
from PIL import Image, ImageOps
import glob

def remove_background_and_crop(image_path, output_path):
    """
    Mejora el recorte de una imagen eliminando el fondo y centrando el objeto.
    """
    # Cargar imagen
    img = cv2.imread(image_path)
    if img is None:
        print(f"Error: No se pudo cargar {image_path}")
        return False

    # Convertir a RGB
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # Convertir a PIL para mejor manipulación
    pil_img = Image.fromarray(img_rgb)

    # Convertir a RGBA si no lo es
    if pil_img.mode != 'RGBA':
        pil_img = pil_img.convert('RGBA')

    # Obtener datos de la imagen
    data = np.array(pil_img)

    # Detectar píxeles blancos y grises claros (fondo)
    # Consideramos como fondo píxeles que son muy claros
    white_threshold = 240
    mask = (data[:,:,0] > white_threshold) & (data[:,:,1] > white_threshold) & (data[:,:,2] > white_threshold)

    # También detectar píxeles grises muy claros
    gray_mask = np.all(data[:,:,:3] > white_threshold - 20, axis=2)

    # Combinar máscaras
    background_mask = mask | gray_mask

    # Hacer transparente el fondo
    data[background_mask] = [255, 255, 255, 0]

    # Crear imagen con fondo transparente
    img_transparent = Image.fromarray(data, 'RGBA')

    # Encontrar el bounding box del contenido no transparente
    # Convertir a numpy para análisis
    alpha_channel = np.array(img_transparent)[:,:,3]

    # Encontrar coordenadas donde hay contenido (alpha > 0)
    coords = np.where(alpha_channel > 0)

    if len(coords[0]) == 0:
        print(f"Advertencia: No se encontró contenido en {image_path}")
        return False

    # Calcular bounding box
    top, bottom = coords[0].min(), coords[0].max()
    left, right = coords[1].min(), coords[1].max()

    # Añadir un pequeño margen
    margin = 20
    height, width = img_transparent.size[1], img_transparent.size[0]

    top = max(0, top - margin)
    bottom = min(height, bottom + margin)
    left = max(0, left - margin)
    right = min(width, right + margin)

    # Recortar la imagen
    cropped = img_transparent.crop((left, top, right, bottom))

    # Crear una imagen cuadrada con el objeto centrado
    # Calcular el tamaño del cuadrado (el lado más largo + margen)
    crop_width = right - left
    crop_height = bottom - top
    square_size = max(crop_width, crop_height) + 40

    # Crear imagen cuadrada con fondo blanco
    square_img = Image.new('RGB', (square_size, square_size), 'white')

    # Calcular posición para centrar
    paste_x = (square_size - crop_width) // 2
    paste_y = (square_size - crop_height) // 2

    # Pegar la imagen recortada en el centro
    # Convertir a RGB para pegar
    cropped_rgb = Image.new('RGB', cropped.size, 'white')
    cropped_rgb.paste(cropped, mask=cropped.split()[-1] if cropped.mode == 'RGBA' else None)

    square_img.paste(cropped_rgb, (paste_x, paste_y))

    # Redimensionar a un tamaño estándar (600x600)
    final_img = square_img.resize((600, 600), Image.Resampling.LANCZOS)

    # Guardar como JPEG con alta calidad
    final_img.save(output_path, 'JPEG', quality=95, optimize=True)

    print(f"OK Procesada: {os.path.basename(image_path)}")
    return True

def process_all_images():
    """
    Procesa todas las imágenes en la carpeta uploads/products
    """
    input_dir = "uploads/products"

    if not os.path.exists(input_dir):
        print(f"Error: La carpeta {input_dir} no existe")
        return

    # Buscar todas las imágenes JPG
    image_files = glob.glob(os.path.join(input_dir, "*.jpg"))
    image_files.extend(glob.glob(os.path.join(input_dir, "*.jpeg")))
    image_files.extend(glob.glob(os.path.join(input_dir, "*.png")))

    if not image_files:
        print("No se encontraron imágenes para procesar")
        return

    print(f"Procesando {len(image_files)} imágenes...")

    successful = 0
    for image_path in image_files:
        # Crear nombre de salida (sobrescribir el original)
        output_path = image_path

        # Crear respaldo del original
        backup_path = image_path.replace('.jpg', '_original.jpg').replace('.jpeg', '_original.jpeg').replace('.png', '_original.png')

        try:
            # Hacer respaldo del original
            if not os.path.exists(backup_path):
                Image.open(image_path).save(backup_path)

            # Procesar imagen
            if remove_background_and_crop(image_path, output_path):
                successful += 1
        except Exception as e:
            print(f"Error procesando {image_path}: {str(e)}")

    print(f"\nOK Procesamiento completado: {successful}/{len(image_files)} imagenes mejoradas")
    print("Los archivos originales se guardaron con sufijo '_original'")

if __name__ == "__main__":
    process_all_images()