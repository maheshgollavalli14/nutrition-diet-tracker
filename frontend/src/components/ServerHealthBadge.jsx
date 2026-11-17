import { useEffect, useState } from 'react';
import { healthApi } from '../services/api';

export default function ServerHealthBadge() {
  const [status, setStatus] = useState({ state: 'checking', message: 'Checking API & MySQL...' });

  useEffect(() => {
    let active = true;
    healthApi
      .check()
      .then((data) => {
        if (!active) return;
        setStatus({
          state: 'ok',
          message: `API & MySQL connected (${data.database?.database})`,
        });
      })
      .catch((err) => {
        if (!active) return;
        const dbData = err.response?.data?.database;
        if (dbData && dbData.connected === false) {
          setStatus({
            state: 'warn',
            message: `Database disconnected (${dbData.error?.code || 'ERROR'}): ${dbData.error?.hint || ''}`,
          });
        } else if (err.response?.status === 503 && err.response?.data?.status === 'schema_incomplete') {
          setStatus({
            state: 'warn',
            message: 'MySQL connected, but tables are missing. Run database/schema.sql.',
          });
        } else {
          setStatus({
            state: 'err',
            message: 'Backend API is unreachable on port 5000.',
          });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (status.state === 'checking') {
    return null;
  }

  const cls =
    status.state === 'ok'
      ? 'alert-success'
      : status.state === 'warn'
      ? 'alert-warning'
      : 'alert-danger';

  return (
    <div
      className={`alert ${cls}`}
      style={{ marginTop: 16, maxWidth: 460, width: '100%', fontSize: '0.86rem' }}
      role="status"
    >
      <span>{status.message}</span>
    </div>
  );
}
