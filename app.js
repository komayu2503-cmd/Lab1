

const users = [
	{ id: 1, name: 'Alice', email: 'alice@example.com' },
	{ id: 2, name: 'Bob', email: 'bob@example.com' },
	{ id: 3, name: 'Carol', email: 'carol@example.com' }
];

const categories = ['News', 'Tutorial', 'Opinion', 'Announcement'];


const postForm = document.querySelector('#postForm');
const userSelect = document.querySelector('#userSelect');
const userSelectErrorEl = document.querySelector('#userSelectError');
const titleEl = document.querySelector('#title');
const categoryEl = document.querySelector('#category');
const textEl = document.querySelector('#text');
const authorEl = document.querySelector('#author');
const postIdEl = document.querySelector('#postId');
const saveBtn = document.querySelector('#saveBtn');
const clearBtn = document.querySelector('#clearBtn');
const postsTableBody = document.querySelector('#postsTable tbody');
const wordCountEl = document.querySelector('#wordCount');


users.forEach(u => {
	const opt = document.createElement('option');
	opt.value = u.id;
	opt.textContent = `${u.name} (${u.email})`;
	userSelect.appendChild(opt);
});

categories.forEach(c => {
	const opt = document.createElement('option');
	opt.value = c;
	opt.textContent = c;
	categoryEl.appendChild(opt);
});


const STORAGE_KEY = 'posts_data_v1';

let posts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

function savePosts() {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function renderPosts() {
	postsTableBody.innerHTML = '';
	posts.forEach(post => {
		const tr = document.createElement('tr');
		const shortText = post.text.length > 200 ? post.text.slice(0, 200) + '…' : post.text;

		tr.innerHTML = `
      <td>${escapeHtml(post.title)}</td>
      <td>${escapeHtml(post.category)}</td>
      <td>${escapeHtml(shortText)}</td>
      <td>${escapeHtml(post.author)}</td>
      <td>${escapeHtml(formatDate(post.createdAt))}</td>
      <td>
        <button data-action="edit" data-id="${post.id}">Редагувати</button>
        <button data-action="delete" data-id="${post.id}">Видалити</button>
      </td>
    `;

		postsTableBody.appendChild(tr);
	});
}

function escapeHtml(s) {
	return String(s)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

function formatDate(iso) {
	try {
		const d = new Date(iso);
		return d.toLocaleString('uk-UA', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	} catch (e) {
		return iso;
	}
}

function resetForm(cancelEdit = true) {
	postForm.reset();
	postIdEl.value = '';
	wordCountEl.textContent = '0/200 слів';
	document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
	document.querySelectorAll('input, textarea, select').forEach(i => i.classList.remove('invalid'));
	if (cancelEdit) currentEditingId = null;
}

function countWords(text) {
	if (!text) return 0;
	return text.trim().split(/\s+/).filter(Boolean).length;
}


function validateField(fieldName) {
	switch (fieldName) {
		case 'title': {
			if (!titleEl.value.trim()) {
				document.querySelector('#titleError').textContent = 'Поле обов\'язкове';
				titleEl.classList.add('invalid');
				return false;
			}
			document.querySelector('#titleError').textContent = '';
			titleEl.classList.remove('invalid');
			return true;
		}
		case 'category': {
			if (!categoryEl.value) {
				document.querySelector('#categoryError').textContent = 'Оберіть категорію';
				categoryEl.classList.add('invalid');
				return false;
			}
			document.querySelector('#categoryError').textContent = '';
			categoryEl.classList.remove('invalid');
			return true;
		}
		case 'text': {
			const words = countWords(textEl.value);
			if (words === 0) {
				document.querySelector('#textError').textContent = 'Поле обов\'язкове';
				textEl.classList.add('invalid');
				return false;
			} else if (words > 200) {
				document.querySelector('#textError').textContent = 'Перевищено ліміт 200 слів';
				textEl.classList.add('invalid');
				return false;
			}
			document.querySelector('#textError').textContent = '';
			textEl.classList.remove('invalid');
			return true;
		}
		case 'author': {
			const val = authorEl.value.trim();
			if (!val) {
				document.querySelector('#authorError').textContent = 'Поле обов\'язкове';
				authorEl.classList.add('invalid');
				if (userSelect) {
					userSelect.classList.add('invalid');
					userSelectErrorEl.textContent = 'Поле обов\'язкове';
				}
				return false;
			}
			if (!/^\S+@\S+\.\S+$/.test(val)) {
				document.querySelector('#authorError').textContent = 'Невірний email';
				authorEl.classList.add('invalid');
				if (userSelect) {
					userSelect.value = ''; 
					userSelect.classList.remove('invalid');
					userSelectErrorEl.textContent = '';
				}
				return false;
			}
			document.querySelector('#authorError').textContent = '';
			authorEl.classList.remove('invalid');
			if (userSelect) {
				userSelect.classList.remove('invalid');
				userSelectErrorEl.textContent = '';
			}
			return true;
		}
		default:
			return true;
	}
}

function validateAll() {
	let valid = true;
	// Title
	if (!titleEl.value.trim()) {
		document.querySelector('#titleError').textContent = 'Поле обов\'язкове';
		titleEl.classList.add('invalid');
		valid = false;
	} else {
		document.querySelector('#titleError').textContent = '';
		titleEl.classList.remove('invalid');
	}

	// Category
	if (!categoryEl.value) {
		document.querySelector('#categoryError').textContent = 'Оберіть категорію';
		categoryEl.classList.add('invalid');
		valid = false;
	} else {
		document.querySelector('#categoryError').textContent = '';
		categoryEl.classList.remove('invalid');
	}

	// Text
	const words = countWords(textEl.value);
	if (words === 0) {
		document.querySelector('#textError').textContent = 'Поле обов\'язкове';
		textEl.classList.add('invalid');
		valid = false;
	} else if (words > 200) {
		document.querySelector('#textError').textContent = 'Перевищено ліміт 200 слів';
		textEl.classList.add('invalid');
		valid = false;
	} else {
		document.querySelector('#textError').textContent = '';
		textEl.classList.remove('invalid');
	}

	// Author
	if (!authorEl.value.trim()) {
		document.querySelector('#authorError').textContent = 'Поле обов\'язкове';
		authorEl.classList.add('invalid');
		
		if (userSelect) {
			userSelect.classList.add('invalid');
			userSelectErrorEl.textContent = 'Поле обов\'язкове';
		}
		valid = false;
	} else if (!/^\S+@\S+\.\S+$/.test(authorEl.value.trim())) {
		document.querySelector('#authorError').textContent = 'Невірний email';
		authorEl.classList.add('invalid');
		valid = false;
	} else {
		document.querySelector('#authorError').textContent = '';
		authorEl.classList.remove('invalid');
		if (userSelect) {
			userSelect.classList.remove('invalid');
			userSelectErrorEl.textContent = '';
		}
	}

	return valid;
}


textEl.addEventListener('input', () => {
	const words = countWords(textEl.value);
	if (words > 200) {
		const parts = textEl.value.trim().split(/\s+/).filter(Boolean).slice(0, 200);
		textEl.value = parts.join(' ');
	}
	wordCountEl.textContent = `${countWords(textEl.value)}/200 слів`;
	validateField('text');
});

userSelect.addEventListener('change', () => {
	const id = userSelect.value;
	const u = users.find(x => String(x.id) === String(id));
	if (u) authorEl.value = u.email;
	
	validateField('author');
});

authorEl.addEventListener('input', () => {
	validateField('author');
});

titleEl.addEventListener('input', () => validateField('title'));
titleEl.addEventListener('blur', () => validateField('title'));
categoryEl.addEventListener('change', () => validateField('category'));
authorEl.addEventListener('blur', () => validateField('author'));

let currentEditingId = null;

saveBtn.addEventListener('click', () => {
	if (!validateAll()) return;

	const data = {
		title: titleEl.value.trim(),
		category: categoryEl.value,
		text: textEl.value.trim(),
		author: authorEl.value.trim()
	};

	const now = new Date().toISOString();

	if (currentEditingId) {
		const idx = posts.findIndex(p => p.id === currentEditingId);
		if (idx !== -1) {
			posts[idx] = { ...posts[idx], ...data, createdAt: now };
		}
	} else {
		const id = String(Date.now()) + Math.floor(Math.random() * 1000);
		posts.unshift({ id, ...data, createdAt: now });
	}

	savePosts();
	renderPosts();
	resetForm(true);
});

clearBtn.addEventListener('click', () => {
	resetForm(true);
});

postsTableBody.addEventListener('click', (e) => {
	const btn = e.target.closest('button');
	if (!btn) return;
	const action = btn.dataset.action;
	const id = btn.dataset.id;
	if (action === 'delete') {
		posts = posts.filter(p => p.id !== id);
		savePosts();
		renderPosts();
		if (currentEditingId === id) resetForm(true);
	} else if (action === 'edit') {
		const p = posts.find(x => x.id === id);
		if (!p) return;
		currentEditingId = p.id;
		postIdEl.value = p.id;
		titleEl.value = p.title;
		categoryEl.value = p.category;
		textEl.value = p.text;
		authorEl.value = p.author;
		wordCountEl.textContent = `${countWords(p.text)}/200 слів`;
		// try to select user if matches
		const matched = users.find(u => u.email === p.author);
		userSelect.value = matched ? matched.id : '';
	}
});

// initial render
renderPosts();
