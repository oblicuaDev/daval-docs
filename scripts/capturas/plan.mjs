// Capturas del manual → static/img/manual/<name>.png
// Requiere la app local (npm run dev:all) con el seed de QA (database/seeds/003_qa_demo.sql).
// La doc es PÚBLICA: se filtran los datos de prueba del chatbot de las respuestas de la API
// y se tapan las credenciales y los clientes reales de SIIGO.
const TEST = /Pruebas|Webhook Temp|\btmp\b|Prueba local/i;
const Q = 'aaaaaaaa-0110-0000-0000-000000000001'; // cotización del seed con notas y comentarios

const click = (page, name) => page.getByRole('button', { name }).first().click();
async function closeCatalogIntro(page) {
  const intro = page.getByRole('button', { name: /^Ver catálogo$/ });
  if (await intro.count()) await intro.first().click().catch(() => {});
}

export default [
  {
    shots: [
      { name: 'general/login', path: '/login' },
      { name: 'general/registro', path: '/login', before: p => click(p, /Registrarme como cliente/) },
    ],
  },
  {
    user: 'admin@daval.com', pass: 'admin123', filter: TEST,
    shots: [
      { name: 'admin/dashboard', path: '/admin' },
      { name: 'admin/cotizaciones', path: '/admin/cotizaciones' },
      { name: 'admin/cotizacion-detalle', path: `/admin/cotizaciones/${Q}` },
      { name: 'admin/rutas', path: '/admin/rutas' },
      { name: 'admin/ruta-nueva', path: '/admin/rutas', before: p => click(p, /Nueva Ruta/) },
      { name: 'admin/empresas', path: '/admin/empresas?empresa=55555555-0104-0000-0000-000000000001' },
      { name: 'admin/clientes', path: '/admin/clientes' },
      {
        // Empresa auto-registrada: su sucursal no tiene ruta ni asesor
        name: 'admin/cliente-nuevo', path: '/admin/clientes',
        before: async p => {
          await click(p, /Nuevo Cliente/);
          const sel = p.locator('.fixed select');
          await sel.nth(0).selectOption({ label: 'Ferretería San José' });
          await sel.nth(1).selectOption({ index: 1 });
          await p.locator('.fixed input').nth(1).fill('Ferretería San José');
        },
      },
      { name: 'admin/asesores', path: '/admin/asesores' },
      { name: 'admin/productos', path: '/admin/catalogo' },
      { name: 'admin/categorias', path: '/admin/centros-de-costos' },
      { name: 'admin/listas-precios', path: '/admin/listas-precios' },
      { name: 'admin/promociones', path: '/admin/promociones' },
      {
        name: 'admin/integraciones', path: '/admin/integraciones',
        before: p => p.$$eval('input', els => els.forEach(el => {
          // Credenciales SIIGO (valor o placeholder "actual: …") → ejemplos
          const v = el.value || el.placeholder || '';
          if (/@|actual:|desarrollo/i.test(v)) {
            el.value = '';
            el.placeholder = v.includes('@') ? 'usuario-api@daval.com' : v.includes('actual:') ? 'actual: ••••••••' : 'mi-partner-id';
          }
        })),
      },
      {
        // Clientes reales traídos de SIIGO: se difuminan
        name: 'admin/clientes-siigo', path: '/admin/integraciones/clientes-siigo', wait: 2500,
        before: p => p.$$eval('tbody tr', els => els.forEach(el => { el.style.filter = 'blur(6px)'; })),
      },
    ],
  },
  {
    user: 'laura.gomez@daval.com', pass: 'asesor123',
    shots: [
      { name: 'asesor/cotizaciones', path: '/asesor' },
      { name: 'asesor/cotizacion-detalle', path: `/asesor/cotizacion/${Q}` },
      { name: 'asesor/clientes', path: '/asesor/clientes' },
      { name: 'asesor/empresas', path: '/asesor/empresas' },
    ],
  },
  {
    // Ruta Norte (lunes, cierra domingo 16:00): abierta casi toda la semana
    user: 'cliente@daval.com', pass: 'cliente123',
    shots: [
      { name: 'cliente/inicio', path: '/cliente' },
      { name: 'cliente/catalogo', path: '/cliente/catalogo', wait: 1500, before: closeCatalogIntro },
      {
        name: 'cliente/carrito', path: '/cliente/catalogo', wait: 1500,
        before: async p => {
          await closeCatalogIntro(p);
          const add = p.getByRole('button', { name: /^Agregar$/ });
          for (const i of [0, 3, 5, 8]) await add.nth(i).click();
          await p.goto(new URL('/cliente/confirmar-cotizacion', p.url()).href);
          await p.waitForTimeout(1200);
        },
      },
    ],
  },
  {
    // Ruta Occidente (martes y jueves). "inicio-cerrado" solo sale cerrado los martes
    // y jueves (o miércoles después de las 17:00); otro día, regenera solo las demás.
    user: 'maria.rodriguez@eltornillo.example.com', pass: 'cliente123',
    shots: [
      { name: 'cliente/inicio-cerrado', path: '/cliente' },
      { name: 'cliente/cotizaciones', path: '/cliente/cotizaciones' },
      { name: 'cliente/cotizacion-detalle', path: `/cliente/cotizaciones/${Q}` },
      { name: 'cliente/mi-empresa', path: '/cliente/administrar' },
    ],
  },
];
