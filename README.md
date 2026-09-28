# DAVAL App — Documentación

Documentación técnica de DAVAL App (arquitectura, referencia de la API e integración con SIIGO), construida con [Docusaurus](https://docusaurus.io/).

Publicada en: https://oblicuadev.github.io/daval-docs/

## Desarrollo

```bash
npm install
npm start          # servidor local con recarga en caliente
npm run build      # genera build/
npm run serve      # sirve build/ localmente
```

## Despliegue

Cada push a `main` construye y publica el sitio en GitHub Pages con el workflow `.github/workflows/deploy.yml`.
