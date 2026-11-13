import React, { useState } from 'react';
import { Form, Button, Alert, Card } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import api, { errorMessage } from '../api';

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register', { username: username.trim(), password });
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setError(errorMessage(err, 'Could not create account. Please try again.'));
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto mt-4" style={{ maxWidth: 420 }}>
      <Card.Body className="p-4">
        <h1 className="h4 text-center mb-4">Create an account</h1>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="username" className="mb-3">
            <Form.Label>Username</Form.Label>
            <Form.Control required autoFocus autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <Form.Text muted>3–30 letters, numbers, dots, dashes or underscores.</Form.Text>
          </Form.Group>
          <Form.Group controlId="password" className="mb-4">
            <Form.Label>Password</Form.Label>
            <Form.Control required type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Form.Text muted>At least 6 characters.</Form.Text>
          </Form.Group>
          <Button type="submit" className="w-100" disabled={loading}>{loading ? 'Creating account…' : 'Sign up'}</Button>
        </Form>
        <p className="text-center small mt-3 mb-0">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </Card.Body>
    </Card>
  );
}
