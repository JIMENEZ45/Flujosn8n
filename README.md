# Flow Center — Panel de automatizaciones n8n

Interfaz web (Next.js 15 + React 19) para ejecutar flujos de n8n desde el navegador,
sin abrir el editor. Diseño tipo HUD futurista.

**Stack:** Next.js 15 · React 19 · TypeScript · Tailwind CSS · Supabase (auth + PostgreSQL) · n8n

**Qué incluye**

- Inicio de sesión y registro con Supabase; nadie ejecuta flujos sin sesión.
- - Roles (`Administrador`, `Editor`, `Invitado`) con seguridad a nivel de fila (RLS).
  - - Cuatro flujos: generar tests JSON, descarga de recursos, matriz de importación CSV y plantillas temáticas.
    - - Modo demo cuando un webhook no está configurado.
     
      - ---

      ## 0. Base de datos (Supabase)

      Pega el contenido de `supabase.sql` en **Supabase → SQL Editor → Run**. Crea la tabla
      `perfiles`, sus políticas de seguridad y el trigger que crea el perfil al registrarse.
      Al final del archivo hay una línea comentada para volverte administrador.

      ---

      ## 1. Probar en tu computador

      ```bash
      npm install
      cp .env.example .env.local   # y llena Supabase y los webhooks
      npm run dev
      ```

      Abre http://localhost:3000

      ---

      ## 2. Subir a Vercel (importante)

      **Vercel NO permite importar un archivo .zip.** Solo acepta repositorios Git o la CLI.
      Elige una de las dos opciones:

      ### Opción A — GitHub (recomendada)

      1. Crea un repositorio vacío en GitHub.
      2. 2. Dentro de esta carpeta (donde está `package.json`):
        
         3. ```bash
            git init
            git add .
            git commit -m "Flow Center"
            git branch -M main
            git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
            git push -u origin main
            ```

            3. En Vercel: **Add New → Project → Import Git Repository**.
            4. 4. Framework: *Next.js* (se detecta solo). **Root Directory: `./`** — déjalo así.
               5. 5. Agrega las variables de entorno (paso 3) y presiona **Deploy**.
                 
                  6. ### Opción B — Vercel CLI
                 
                  7. ```bash
                     npm i -g vercel
                     vercel        # despliegue de prueba
                     vercel --prod # producción
                     ```

                     > ⚠️ Sube el contenido de **esta** carpeta directamente. Si subes una carpeta que
                     > > contiene otra carpeta con el proyecto adentro, Vercel no encuentra el
                     > > > `package.json` y falla con *"No Next.js version detected"*.
                     > > >
                     > > > ---
                     > > >
                     > > > ## 3. Variables de entorno
                     > > >
                     > > > En Vercel → Project → **Settings → Environment Variables**:
                     > > >
                     > > > | Variable | Descripción |
                     > > > |---|---|
                     > > > | `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto en Supabase |
                     > > > | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública (anon) de Supabase |
                     > > > | `N8N_WEBHOOK_AUT_TESTS` | Webhook de "Generar tests JSON" |
                     > > > | `N8N_WEBHOOK_DESCARGAR_RECURSOS` | Webhook de "Descarga de recursos" |
                     > > > | `N8N_WEBHOOK_MATRIZ_CSV` | Webhook de "Matriz de importación CSV" |
                     > > > | `N8N_WEBHOOK_PLANTILLAS` | Webhook de "Generador de plantillas temáticas" |
                     > > > | `N8N_SHARED_SECRET` | (Opcional) misma clave del Header Auth en n8n |
                     > > >
                     > > > Si una variable queda vacía, ese flujo responde en **modo demo** en vez de romperse.
                     > > > Después de agregar variables hay que hacer **Redeploy**.
                     > > >
                     > > > ---
                     > > >
                     > > > ## 4. Del lado de n8n
                     > > >
                     > > > - El nodo **Webhook** debe estar en método `POST` y **activo** (URL de producción, no la de test).
                     > > > - - Los campos llegan en la raíz del body: se leen como `$json.body.googleDocUrl`, etc.
                     > > >   - - Si usas `N8N_SHARED_SECRET`, valida el header `x-n8n-secret`.
                     > > >     - - Responde con un nodo **Respond to Webhook** en JSON, por ejemplo:
                     > > >      
                     > > >       - ```json
                     > > >         { "message": "Listo", "folderUrl": "https://drive.google.com/...", "totalTests": 12 }
                     > > >         ```
                     > > >
                     > > > `message`, `folderUrl` y `totalTests` se muestran automáticamente en la interfaz.
                     > > >
                     > > > ---
                     > > >
                     > > > ## 5. Agregar un flujo nuevo
                     > > >
                     > > > 1. En `app/panel.tsx`, añade un objeto al arreglo `flows` (id, código, nombre, campos).
                     > > > 2. 2. En `app/api/execute/route.ts`, agrega la entrada correspondiente en `webhookMap`.
                     > > >    3. 3. Crea la variable de entorno con la URL del webhook.
                     > > >      
                     > > >       4. ---
                     > > >      
                     > > >       5. ## Estructura
                     > > >      
                     > > >       6. ```
                     > > > app/
                     > > >   api/execute/route.ts   → puente seguro hacia n8n (las URLs nunca llegan al navegador)
                     > > >   auth/acciones.ts       → login, registro y cierre de sesión
                     > > >   login/ · registro/     → pantallas de acceso
                     > > >   panel.tsx              → tarjetas, buscador y modal de ejecución
                     > > >   page.tsx · layout.tsx · globals.css
                     > > > lib/supabase/            → clientes de Supabase (navegador, servidor, middleware)
                     > > > middleware.ts            → protege las rutas: sin sesión no se entra al panel
                     > > > supabase.sql             → tablas, seguridad por filas y roles
                     > > > preview.html             → vista rápida del diseño (ábrelo con doble clic)
                     > > > ```
                     > > >
                     > > > ---
                     > > >
                     > > > ## Versiones (importante)
                     > > >
                     > > > Vercel **bloquea automáticamente** los deploys que usen versiones de Next.js afectadas
                     > > > por CVE-2025-66478. Este proyecto ya usa versiones parcheadas:
                     > > >
                     > > > - `next` 15.5.22
                     > > > - `react` / `react-dom` 19.2.8
                     > > >
                     > > > No bajes estas versiones. Si en el futuro ves el aviso otra vez, corre:
                     > > >
                     > > > ```bash
                     > > > npx fix-react2shell-next --fix
                     > > > npm install
                     > > > ```
                     > > > 
