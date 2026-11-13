import React, { useState } from 'react';
import { Form, Button, Alert, Card } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { errorMessage } from '../api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
      // Return to the page that asked them to log in, if any
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Could not log in. Please try again.'));
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto mt-4" style={{ maxWidth: 420 }}>
      <Card.Body className="p-4">
        <h1 className="h4 text-center mb-4">Log in</h1>
        {location.state?.registered && !error && (
          <Alert variant="success">Account created. You can log in now.</Alert>
        )}
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="username" className="mb-3">
            <Form.Label>Username</Form.Label>
            <Form.Control required autoFocus autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
          </Form.Group>
          <Form.Group controlId="password" className="mb-4">
            <Form.Label>Password</Form.Label>
            <Form.Control required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Form.Group>
          <Button type="submit" className="w-100" disabled={loading}>{loading ? 'Logging in…' : 'Log in'}</Button>
        </Form>
        <p className="text-center small mt-3 mb-0">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </Card.Body>
    </Card>
  );
}
