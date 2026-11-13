import React from 'react';
import { Card, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { GeoAlt, Clock } from 'react-bootstrap-icons';
import { dateParts, formatTime, isPast } from '../utils/format';

export default function EventCard({ event, showOrganiser = true }) {
  const { month, day } = dateParts(event.startsAt);
  return (
    <Card className="event-card mb-3">
      <Card.Body className="d-flex gap-3">
        <div className="event-date flex-shrink-0" aria-hidden="true">
          <div className="month">{month}</div>
          <div className="day">{day}</div>
        </div>
        <div className="flex-grow-1 min-w-0">
          <Card.Title as="h5" className="mb-1">
            <Link to={`/events/${event._id}`} className="text-decoration-none stretched-link">
              {event.title}
            </Link>
            {isPast(event.startsAt) && <Badge bg="secondary" className="ms-2 align-middle">Past</Badge>}
          </Card.Title>
          <div className="text-muted small d-flex flex-wrap column-gap-3 row-gap-1">
            <span><Clock className="me-1" />{formatTime(event.startsAt)}</span>
            <span><GeoAlt className="me-1" />{event.location}</span>
            {showOrganiser && event.organiser && <span>by {event.organiser.username}</span>}
          </div>
          {event.tags?.length > 0 && (
            <div className="mt-2">
              {event.tags.map((t) => (
                <Badge key={t} bg="light" text="dark" className="me-1 border">{t}</Badge>
              ))}
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}
