import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import {motion} from 'framer-motion';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Modular & Tree-Shakable',
    Svg: require('@site/static/img/tree_shakable.svg').default,
    description: (
      <>
        Import only what you need. Every utility is independently importable
        and tree-shakable, keeping your bundle sizes small and efficient.
      </>
    ),
  },
  {
    title: 'Production-Ready',
    Svg: require('@site/static/img/production_ready.svg').default,
    description: (
      <>
        Built for real-world applications with enterprise-grade features like
        robust error handling, proper logging, and comprehensive security utilities.
      </>
    ),
  },
  {
    title: 'TypeScript First',
    Svg: require('@site/static/img/typescript_first.svg').default,
    description: (
      <>
        Fully typed API with comprehensive type definitions. Enjoy intelligent
        autocomplete and compile-time safety in your Node.js applications.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <motion.div
      className={clsx('col col--4', styles.featureCard)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3" className="margin-bottom--sm">{title}</Heading>
        <p>{description}</p>
      </div>
    </motion.div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
