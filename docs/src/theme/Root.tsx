import React, { useEffect } from 'react';

export default function Root({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const host = window.location.hostname;
    if (host === 'catbee-utils.npm.hprasath.com') {
      const target = `https://catbee.npm.hprasath.com${window.location.pathname}${window.location.search}${window.location.hash}`;
      window.location.replace(target);
    }
  }, []);

  return <>{children}</>;
}
