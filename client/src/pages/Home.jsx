import React, { useEffect, useState } from 'react';
import { Row, Col, Form, Button, Card, ListGroup, Nav, Spinner, Alert, Badge } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router-dom';
import api, { errorMessage } from '../api';
import EventCard from '../components/EventCard';

export default function Home() {
  const [params, setParams] = useSearchParams();
  const when = params.get('when') === 'past' ? 'past' : 'upcoming';
  const search = params.get('search') || '';

  const [query, setQuery] = useState(search);
  const [events, setEvents] = useState([]);
  const [organisers, setOrganisers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Reload whenever the tab or search in the URL changes
  useEffect(() => {
    setLoading(true);
    setError('');
    api.get('/events', { params: { when, search } })
      .then((res) => setEvents(res.data.events))
      .catch((err) => setError(errorMessage(err, 'Could not load events.')))
      .finally(() => setLoading(false));
  }, [when, search]);

  useEffect(() => {
    api.get('/organisers')
      .then((res) => setOrganisers(res.data.organisers))
      .catch(() => setOrganisers([]));
  }, []);

  const updateParams = (next) => {
    const merged = { when, search, ...next };
    const clean = {};
    if (merged.when === 'past') clean.when = 'past';
    if (merged.search) clean.search = merged.search;
    setParams(clean);
  };

  return (
    <Row>
      <Col lg={8}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="h3 mb-0">{when === 'past' ? 'Past events' : 'Upcoming events'}</h1>
        </div>

        <Form
          className="d-flex gap-2 mb-3"
          role="search"
          onSubmit={(e) => { e.preventDefault(); updateParams({ search: query.trim() }); }}
        >
          <Form.Control
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, location or tag"
            aria-label="Search events"
          />
          <Button type="submit">Search</Button>
          {search && (
            <Button variant="outline-secondary" onClick={() => { setQuery(''); updateParams({ search: '' }); }}>
              Clear
            </Button>
          )}
        </Form>

        <Nav variant="tabs" activeKey={when} className="mb-3" onSelect={(k) => updateParams({ when: k })}>
          <Nav.Item><Nav.Link eventKey="upcoming">Upcoming</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="past">Past</Nav.Link></Nav.Item>
        </Nav>

        {error && <Alert variant="danger">{error}</Alert>}
        {loading ? (
          <div className="text-center my-5"><Spinner animation="border" /></div>
        ) : events.length === 0 ? (
          <Card body className="text-center text-muted">
            {search ? `No ${when} events match "${search}".` : `No ${when} events yet.`}
          </Card>
        ) : (
          events.map((ev) => <EventCard key={ev._id} event={ev} />)
        )}
      </Col>

      <Col lg={4}>
        <Card className="mb-3">
          <Card.Header>Organisers with upcoming events</Card.Header>
          <ListGroup variant="flush">
            {organisers.length === 0 && <ListGroup.Item className="text-muted">None yet.</ListGroup.Item>}
            {organisers.map((o) => (
              <ListGroup.Item
                key={o._id}
                action
                as={Link}
                to={`/organisers/${o._id}`}
                className="d-flex justify-content-between align-items-center"
              >
                {o.username}
                <Badge bg="primary" pill>{o.upcoming}</Badge>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card>
        <Card body className="small text-muted">
          Follow an organiser and you&rsquo;ll get a live notification the moment they post a new event.
        </Card>
      </Col>
    </Row>
  );
}
