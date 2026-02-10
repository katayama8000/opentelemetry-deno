Deno.serve(async (req) => {
  console.log('Incoming request', req.url);
  const res = await fetch('https://jsonplaceholder.typicode.com/todos');

  const todos = await res.json();

  if (!res.ok) {
    console.error('Failed to fetch todos:', res.statusText);
    return new Response('Error fetching todos', { status: 500 });
  }

  console.log('fetch todos', todos);

  return new Response(JSON.stringify(todos), {
    headers: { 'content-type': 'application/json' },
  });
});
