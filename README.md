# Flow Center — Panel de automatizaciones n8n

Interfaz web (Next.js 15 + React 19) para ejecutar flujos de n8n desde el navegador,
sin abrir el editor. Diseño tipo HUD futurista.

---

## 1. Probar en tu computador

```bash
npm install
cp .env.example .env.local   # y llena los webhooks
npm run dev
```

Abre http://localhost:3000

---

## 2. Subir a Vercel (importante)

**Vercel NO permite importar un archivo .zip.** Solo acepta repositorios Git o la CLI.
Elige una de las dos opciones:

### Opción A — GitHub (recomendada)

1. Crea un repositorio vacío en GitHub.
2. Dentro de esta carpeta (donde está `package.json`):

```bash
git init
git add .
git commit -m "Flow Center"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
git push -u origin main
```

3. En Vercel: **Add New → Project → Import Git Repository**.
4. Framework: *Next.js* (se detecta solo). **Root Directory: `./`** — déjalo así.
5. Agrega las variables de entorno (paso 3) y presiona **Deploy**.

### Opción B — Vercel CLI

```bash
npm i -g vercel
vercel        # despliegue de prueba
vercel --prod # producción
```

> ⚠️ Sube el contenido de **esta** carpeta directamente. Si subes una carpeta que
> contiene otra carpeta con el proyecto adentro, Vercel no encuentra el
> `package.json` y falla con *"No Next.js version detected"*.

---

## 3. Variables de entorno

En Vercel → Project → **Settings → Environment Variables**:

| Variable | Descripción |
|---|---|
| `N8N_WEBHOOK_AUT_TESTS` | URL de producción del webhook de "Generar tests JSON" |
| `N8N_WEBHOOK_COURSE_RESOURCES` | Webhook de "Procesar recursos" |
| `N8N_WEBHOOK_COMPARE_DOCUMENTS` | Webhook de "Comparar documentos" |
| `N8N_SHARED_SECRET` | (Opcional) misma clave del Header Auth en n8n |

Si una variable queda vacía, ese flujo responde en **modo demo** en vez de romperse.
Después de agregar variables hay que hacer **Redeploy**.

---

## 4. Del lado de n8n

- El nodo **Webhook** debe estar en método `POST` y **activo** (URL de producción, no la de test).
- Los campos llegan en la raíz del body: se leen como `$json.body.googleDocUrl`, etc.
- Si usas `N8N_SHARED_SECRET`, valida el header `x-n8n-secret`.
- Responde con un nodo **Respond to Webhook** en JSON, por ejemplo:

```json
{ "message": "Listo", "folderUrl": "https://drive.google.com/...", "totalTests": 12 }
```

`message`, `folderUrl` y `totalTests` se muestran automáticamente en la interfaz.

---

## 5. Agregar un flujo nuevo

1. En `app/page.tsx`, añade un objeto al arreglo `flows` (id, código, nombre, campos).
2. En `app/api/execute/route.ts`, agrega la entrada correspondiente en `webhookMap`.
3. Crea la variable de entorno con la URL del webhook.

---

## Estructura

```
app/
  api/execute/route.ts   → puente seguro hacia n8n (las URLs nunca llegan al navegador)
  globals.css            → tema HUD futurista
  layout.tsx
  page.tsx               → tarjetas, buscador y modal de ejecución
preview.html             → vista rápida del diseño (ábrelo con doble clic)
```

---

## Versiones (importante)

Vercel **bloquea automáticamente** los deploys que usen versiones de Next.js afectadas
por CVE-2025-66478. Este proyecto ya usa versiones parcheadas:

- `next` 15.5.22
- `react` / `react-dom` 19.2.8

No bajes estas versiones. Si en el futuro ves el aviso otra vez, corre:

```bash
npx fix-react2shell-next --fix
npm install
```
