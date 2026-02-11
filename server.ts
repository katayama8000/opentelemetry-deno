import { trace, SpanStatusCode, Span } from '@opentelemetry/api';

/**
 * Define URL patterns for routing
 */
const TODO_LIST_PATTERN = new URLPattern({ pathname: '/' });
const TODO_DETAIL_PATTERN = new URLPattern({ pathname: '/todos/:id' });

// --- Route Handlers ---

/**
 * Handles GET / - Fetches the full list of todos
 */
async function handleListTodos(span?: Span) {
  span?.updateName('GET /');
  span?.setAttribute('http.route', '/');

  const res = await fetch('https://jsonplaceholder.typicode.com/todos');

  if (!res.ok) {
    throw new Error(`External API returned status: ${res.status}`);
  }

  const todos = await res.json();

  // Custom attribute to track the number of items returned
  span?.setAttribute('app.todo_count', todos.length);

  return Response.json(todos);
}

/**
 * Handles GET /todos/:id - Fetches a single todo by its ID
 */
async function handleGetTodo(id: string, span?: Span) {
  // Update span info with the dynamic route and ID
  span?.updateName('GET /todos/:id');
  span?.setAttribute('http.route', '/todos/:id');
  span?.setAttribute('app.todo_id', id);

  const res = await fetch(`https://jsonplaceholder.typicode.com/todos/${id}`);

  // Handle 404 from upstream gracefully
  if (res.status === 404) {
    return new Response('Todo Not Found', { status: 404 });
  }

  if (!res.ok) {
    throw new Error(`External API returned status: ${res.status}`);
  }

  const todo = await res.json();
  return Response.json(todo);
}

// --- Main Server Entry Point ---

Deno.serve(async (req) => {
  const url = req.url;
  const span = trace.getActiveSpan();

  try {
    // 1. Route: GET /
    if (TODO_LIST_PATTERN.test(url)) {
      return await handleListTodos(span);
    }

    // 2. Route: GET /todos/:id
    const match = TODO_DETAIL_PATTERN.exec(url);
    if (match) {
      const id = match.pathname.groups.id!;
      return await handleGetTodo(id, span);
    }

    // 3. 404 Fallback
    span?.setStatus({
      code: SpanStatusCode.ERROR,
      message: 'Route not found',
    });
    return new Response('Not Found', { status: 404 });
  } catch (err) {
    // Log error and record telemetry exception
    console.error('Request Error:', err);

    const error = err as Error;
    span?.recordException(error);
    span?.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });

    return new Response('Internal Server Error', { status: 500 });
  }
});
