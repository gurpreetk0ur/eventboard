import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListGroup, Spinner, Card } from 'react-bootstrap';
import api from '../api';
import FollowButton from '../components/FollowButton';

export default function Following() {
  const [organisers, setOrganisers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/follows')
      .then((res) => setOrganisers(res.data.organisers))
      .catch((err) => console.error('Could not load follows', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center my-5"><Spinner animation="border" /></div>;

  return (
    <div className="mx-auto" style={{ maxWidth: 640 }}>
      <h1 className="h3 mb-3">Organisers you follow</h1>
      {organisers.length === 0 ? (
        <Card body className="text-muted">
          You&rsquo;re not following anyone yet. Open an event or organiser and press Follow
          to get notified when they post. <Link to="/">Browse events</Link>
        </Card>
      ) : (
        <ListGroup>
          {organisers.map((o) => (
            <ListGroup.Item key={o._id} className="d-flex justify-content-between align-items-center">
              <Link to={`/organisers/${o._id}`}>{o.username}</Link>
              <FollowButton organiserId={o._id} size="sm" />
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </div>
  );
}
