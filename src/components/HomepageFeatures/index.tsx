import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  to: string;
  icon: ReactNode;
  description: ReactNode;
};

// Íconos en línea con el trazo de lucide-react (la librería de íconos de la app)
const iconProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Arquitectura',
    to: '/docs/arquitectura/vision-general',
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    description: (
      <>
        React + Vite en el frontend, Express en el backend y PostgreSQL como
        base de datos. Cómo se conectan las piezas y dónde vive cada regla.
      </>
    ),
  },
  {
    title: 'Referencia API',
    to: '/docs/api/introduccion',
    icon: (
      <svg {...iconProps}>
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    description: (
      <>
        Todos los endpoints bajo <code>/api</code>: parámetros, cuerpos,
        respuestas, roles requeridos y códigos de error.
      </>
    ),
  },
  {
    title: 'Integración SIIGO',
    to: '/docs/integraciones/siigo',
    icon: (
      <svg {...iconProps}>
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M3 21v-5h5" />
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
      </svg>
    ),
    description: (
      <>
        Sincronización de productos, importación y exportación de clientes y
        envío de cotizaciones al ERP SIIGO.
      </>
    ),
  },
];

function Feature({title, to, icon, description}: FeatureItem) {
  return (
    <Link to={to} className={styles.card}>
      <div className={styles.icon}>{icon}</div>
      <Heading as="h3" className={styles.title}>
        {title}
      </Heading>
      <p className={styles.description}>{description}</p>
    </Link>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className={styles.grid}>
        {FeatureList.map((props) => (
          <Feature key={props.title} {...props} />
        ))}
      </div>
    </section>
  );
}
