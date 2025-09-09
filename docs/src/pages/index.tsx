import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';
import {motion} from 'framer-motion';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <div className={styles.heroContent}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Heading as="h1" className="hero__title">
              {siteConfig.title}
            </Heading>
            <p className="hero__subtitle">{siteConfig.tagline}</p>
            <p className={clsx(styles.heroDescription)} style={{ paddingLeft: 0 }}>
              A modular, production-grade utility library for Node.js and
              TypeScript. Built for robust, scalable applications and enterprise
              Express services. Every utility is tree-shakable, fully typed, and
              can be imported independently for optimal bundle size.
            </p>
            <div className={styles.buttons}>
              <Link id='explore-docs' className="button button--primary button--lg" to="/docs/">
                🚀 Explore Docs
              </Link>
            </div>
          </motion.div>
          <motion.div
            className={styles.heroImage}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <img
              src="./img/javascript.svg"
              alt="Code Preview"
              className={styles.heroSvg}
            />
          </motion.div>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Utility Modules for Node.js">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
