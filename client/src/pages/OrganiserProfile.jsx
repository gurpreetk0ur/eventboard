import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Spinner, Alert, Card } from 'react-bootstrap';
import api, { errorMessage } from '../api';
import FollowButton from '../components/FollowButton';
import EventCard from '../components/EventCard';
import { isPast } from '../utils/format';

export default function OrganiserProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api.get(`/organisers/${id}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(errorMessage(err, 'Could not load organiser.')))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center my-5"><Spinner animation="border" /></div>;
  if (!data) return <Alert variant="warning">{error} <Link to="/">Back to events</Link></Alert>;

  const upcoming = data.events.filter((e) => !isPast(e.startsAt));
  const past = data.events.filter((e) => isPast(e.startsAt)).reverse();

  // Keep the follower count in step with the button
  const onFollowChange = (following) =>
    setData((d) => ({ ...d, followers: d.followers + (following ? 1 : -1) }));

  return (
    <div className="mx-auto" style={{ maxWidth: 760 }}>
      <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
        <div className="flex-grow-1">
          <h1 className="h3 mb-0">{data.organiser.username}</h1>
          <span className="text-muted">
            {data.followers} follower{data.followers === 1 ? '' : 's'} · {data.events.length} event{data.events.length === 1 ? '' : 's'}
          </span>
        </div>
        <FollowButton organiserId={data.organiser._id} onChange={onFollowChange} />
      </div>

      <h2 className="h5">Upcoming</h2>
      {upcoming.length === 0
        ? <Card body className="text-muted mb-4">No upcoming events.</Card>
        : upcoming.map((e) => <EventCard key={e._id} event={e} showOrganiser={false} />)}

      {past.length > 0 && (
        <>
          <h2 className="h5 mt-4">Past</h2>
          {past.map((e) => <EventCard key={e._id} event={e} showOrganiser={false} />)}
        </>
      )}
    </div>
  );
}
