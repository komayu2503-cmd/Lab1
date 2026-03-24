import express, { Request, Response } from "express";
import path = require("path");
import fs = require("fs");
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

function readData() {
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ ok: true });
});


function writeData(data: Record<string, any>) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

app.get('/users', (req, res) => {
  const data = readData();
  res.json(data.users);
});

app.get('/categories', (req, res) => {
  const data = readData();
  res.json(data.categories);
});

app.get('/posts', (req, res) => {
  const data = readData();
  const {
    q = '',
    category,
    author,
    userId,
    sortOrder = 'desc',
    sortBy
  } = req.query;

  const query = String(q).trim().toLowerCase();

  const filtered = data.posts.filter((post) => { //todo: search or delete
    const matchesQuery = query
      ? `${post.title} ${post.category} ${post.text} ${post.author}`.toLowerCase().includes(query)
      : true;

    const matchesCategory = category ? post.category === category : true;
    const matchesAuthor = author ? post.author.toLowerCase().includes(String(author).toLowerCase()) : true;
    const matchesUser = userId ? String(post.userId) === String(userId) : true;

    return matchesQuery && matchesCategory && matchesAuthor && matchesUser;
  });

  let sorted = filtered.sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];

    if (sortBy === 'createdAt') {
      valA = new Date(valA);
      valB = new Date(valB);
    }

    if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;

  });
  // const sorted = filtered.sort((a, b) => {
  //   const aTime = new Date(a.createdAt).getTime() || 0;
  //   const bTime = new Date(b.createdAt).getTime() || 0;
  //   return sort === 'asc' ? aTime - bTime : bTime - aTime;
  // });

  res.json(sorted);
});

app.post('/posts', (req, res) => {
  const data = readData();
  const { title, category, text, author, userId } = req.body;

  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: 'title is required' });
  }

  if (!category || !data.categories.includes(category)) {
    return res.status(400).json({ error: 'category is invalid or missing' });
  }

  const words = countWords(text);
  if (!text || words === 0 || words > 200) {
    return res.status(400).json({ error: 'text is required and must be <= 200 words' });
  }

  if (!author || !/^\S+@\S+\.\S+$/.test(String(author).trim())) {
    return res.status(400).json({ error: 'author email is invalid or missing' });
  }

  if (userId) {
    const userExists = data.users.some((u) => String(u.id) === String(userId));
    if (!userExists) {
      return res.status(400).json({ error: 'userId does not exist' });
    }
  }

  const newPost = {
    id: `${Date.now()}${Math.floor(Math.random() * 1000)}`,
    title: String(title).trim(),
    category,
    text: String(text).trim(),
    author: String(author).trim(),
    userId: userId ? Number(userId) : null,
    createdAt: new Date().toISOString()
  };

  data.posts.unshift(newPost);
  writeData(data);

  res.status(201).json(newPost);
});

app.put('/posts/:id', (req, res) => {
  const data = readData();
  const { id } = req.params;
  const { title, category, text, author, userId } = req.body;

  const idx = data.posts.findIndex((post) => String(post.id) === String(id));
  if (idx === -1) {
    return res.status(404).json({ error: 'post not found' });
  }

  if (title !== undefined && !String(title).trim()) {
    return res.status(400).json({ error: 'title cannot be empty' });
  }

  if (category !== undefined && !data.categories.includes(category)) {
    return res.status(400).json({ error: 'category is invalid' });
  }

  if (text !== undefined) {
    const words = countWords(text);
    if (!String(text).trim() || words > 200) {
      return res.status(400).json({ error: 'text must be non-empty and <= 200 words' });
    }
  }

  if (author !== undefined && !/^\S+@\S+\.\S+$/.test(String(author).trim())) {
    return res.status(400).json({ error: 'author email is invalid' });
  }

  if (userId !== undefined && userId !== null) {
    const userExists = data.users.some((u) => String(u.id) === String(userId));
    if (!userExists) {
      return res.status(400).json({ error: 'userId does not exist' });
    }
  }

  const current = data.posts[idx];
  const updatedPost = {
    ...current,
    ...(title !== undefined ? { title: String(title).trim() } : {}),
    ...(category !== undefined ? { category } : {}),
    ...(text !== undefined ? { text: String(text).trim() } : {}),
    ...(author !== undefined ? { author: String(author).trim() } : {}),
    ...(userId !== undefined ? { userId: userId === null ? null : Number(userId) } : {}),
    updatedAt: new Date().toISOString()
  };

  data.posts[idx] = updatedPost;
  writeData(data);

  return res.status(200).json(updatedPost);
});

app.delete('/posts/:id', (req, res) => {
  const data = readData();
  const { id } = req.params;
  const before = data.posts.length;

  data.posts = data.posts.filter((post) => String(post.id) !== String(id));

  if (data.posts.length === before) {
    return res.status(404).json({ error: 'post not found' });
  }

  writeData(data);
  return res.status(200).json({ message: 'post deleted', id });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Post publisher API is running',
    endpoints: {
      users: 'GET /users',
      categories: 'GET /categories',
      postsGet: 'GET /posts?q=&category=&author=&userId=&sort=asc|desc',
      postsCreate: 'POST /posts',
      postsUpdate: 'PUT /posts/:id',
      postsDelete: 'DELETE /posts/:id'
    }
  });
});


app.listen(PORT, () => console.log("API started on http://localhost:" + PORT));


