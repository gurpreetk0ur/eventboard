import React, { useEffect, useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import api from '../api';
import { useAuth } from '../auth';

// Follow / unfollow an organiser. Hidden for visitors and for the organiser themselves.
export default function FollowButton({ organiserId, size, onChange }) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(null);
  const [busy, setBusy] = useState(false);
  const hidden = !user || !organiserId || user._id === organiserId;

  useEffect(() => {
    if (hidden) return;
    api.get(`/follows/${organiserId}`)
      .then((res) => setFollowing(res.data.following))
      .catch(() => setFollowing(false));
  }, [organiserId, hidden]);

  if (hidden) return null;

  const toggle = async () => {
    setBusy(true);
    try {
      const res = following
        ? await api.delete(`/follows/${organiserId}`)
        : await api.post(`/follows/${organiserId}`);
      setFollowing(res.data.following);
      onChange?.(res.data.following);
    } catch (err) {
      console.error('Follow error', err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      size={size}
      variant={following ? 'outline-secondary' : 'primary'}
      onClick={toggle}
      disabled={busy || following === null}
    >
      {busy ? <Spinner animation="border" size="sm" /> : following ? 'Following ✓' : 'Follow'}
    </Button>
  );
}
