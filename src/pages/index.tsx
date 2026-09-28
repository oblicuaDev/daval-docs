import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={styles.hero}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.heroInner}>
        <div className={styles.logoBox}>
          <img src={useBaseUrl('/img/logo-daval.jpeg')} alt="DAVAL" />
        </div>
        <span className={styles.eyebrow}>Documentación técnica</span>
        <Heading as="h1" className={styles.title}>
          {siteConfig.title}
        </Heading>
        <p className={styles.subtitle}>
          Sistema comercial B2B de Distribuciones DAVAL: catálogo, listas de
          precios, rutas, cotizaciones e integración con SIIGO.
        </p>
        <div className={styles.buttons}>
          <Link className="button button--primary button--lg" to="/docs/intro">
            Guía del proyecto
          </Link>
          <Link className="button button--secondary button--lg" to="/docs/api/introduccion">
            Referencia API
          </Link>
        </div>
        <div className={styles.stack}>
          {['React 18', 'Vite', 'Express', 'PostgreSQL', 'SIIGO'].map((t) => (
            <span key={t} className={styles.badge}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="Documentación técnica de DAVAL App: arquitectura, endpoints de la API e integración con SIIGO.">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
