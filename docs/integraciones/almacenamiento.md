---
sidebar_position: 3
title: Almacenamiento de imágenes
---

# Almacenamiento de imágenes

Las imágenes de productos se guardan en **Supabase Storage** usando su API compatible con S3 (`@aws-sdk/client-s3`). Implementación en `api/src/lib/storage.js`.

## Flujo

```text
POST /api/products/:id/image  (multipart, campo "image")
  ├─ multer (memoria, máx. 5 MB, JPEG/PNG/WebP/GIF)
  ├─ nombre aleatorio: <32 hex>.<ext>
  ├─ PutObject en el bucket
  ├─ products.image_url = URL pública
  └─ borra la imagen anterior (en segundo plano, ignora errores)
```

URL pública resultante:

```text
https://<proyecto>.supabase.co/storage/v1/object/public/<bucket>/<archivo>
```

## Configuración

| Variable | Descripción |
|---|---|
| `SUPABASE_S3_ENDPOINT` | `https://<proyecto>.storage.supabase.co/storage/v1/s3` |
| `SUPABASE_S3_ACCESS_KEY` | Access Key ID (Supabase → Storage → S3 Connection) |
| `SUPABASE_S3_SECRET_KEY` | Secret Access Key |
| `SUPABASE_S3_REGION` | Opcional, por defecto `auto` |
| `SUPABASE_BUCKET` | Por defecto `product-images`. Debe ser **público** |

Si faltan las tres primeras, la subida falla con un error `500`.

## Carpeta `/uploads`

La app también sirve estáticos desde `api/uploads` en `/uploads` (caché de 7 días). Es un remanente del almacenamiento local de desarrollo; las subidas nuevas van a Supabase Storage.
