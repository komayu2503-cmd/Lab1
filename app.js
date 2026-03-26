

let users = [];

let categories = [];


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
const sortDateBtn = document.querySelector('#sortDateBtn');
const sortDirectionIconEl = document.querySelector('#sortDirectionIcon');

const API_URL = 'http://localhost:3000/api'
function getUsersAndCategories() {
fetch(`${API_URL}/users`)
	.then(response => response.json())
	.then(_users => {
		users = _users.items;
		users.forEach(u => {
			const opt = document.createElement('option');
			opt.value = u.id;
			opt.textContent = `${u.name} (${u.email})`;
			userSelect.appendChild(opt);
			
		});
		
	});


fetch(`${API_URL}/categories`)
	.then(response => response.json())
	.then(_categories => {
		categories = _categories.items;
		categories.forEach(c => {
			const opt = document.createElement('option');
			opt.value = c;
			opt.textContent = c;
			categoryEl.appendChild(opt);
		});
				
	});
}



let posts = [];
let sortDirection = 'desc'; // or 'asc'
let sortField = 'createdAt';

async function getPosts() {
	try {
		const response = await fetch(`${API_URL}/posts?sortOrder=${sortDirection}&sortBy=${sortField}`);
		if (!response.ok) throw new Error('Failed to fetch posts');
		const { items } = await response.json();
		posts = items;
		renderPosts();
	} catch (error) {
		console.error('Error fetching posts:', error);
		posts = [];
		renderPosts();
	}
}


function renderPosts() {
	postsTableBody.innerHTML = '';
	console.log(posts);
	// let sortedPosts = posts.sort((a, b) => {
	// 	let valA = a[sortField];
	// 	let valB = b[sortField];

	// 	if(sortField === 'createdAt'){
	// 		valA = new Date (valA);
	// 		valB = new Date (valB);
	// 	}

	// 	if (typeof valA === 'string'){
	// 		valA = valA.toLowerCase();
	// 		valB = valB.toLowerCase();
	// 	}

	// 	if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
	// 	if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
	// 	return 0;
	
	// });
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
	if (sortDirectionIconEl) {
		sortDirectionIconEl.textContent = sortDirection === 'desc' ? '↓' : '↑';
	}
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

saveBtn.addEventListener('click', async () => {
	if (!validateAll()) return;

	const data = {
		title: titleEl.value.trim(),
		category: categoryEl.value,
		text: textEl.value.trim(),
		author: authorEl.value.trim()
	};

	// Add userId if a user is selected
	if (userSelect && userSelect.value) {
		data.userId = userSelect.value;
	}

	try {
		let response;
		
		if (currentEditingId) {
			// Update existing post
			response = await fetch(`${API_URL}/posts/${currentEditingId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			});
		} else {
			// Create new post
			response = await fetch(`${API_URL}/posts`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			});
		}

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to save post');
		}

		await getPosts();
		resetForm(true);
	} catch (error) {
		console.error('Error saving post:', error);
		alert(`Error saving post: ${error.message}`);
	}
});

clearBtn.addEventListener('click', () => {
	resetForm(true);
});

postsTableBody.addEventListener('click', async (e) => {
	const btn = e.target.closest('button');
	if (!btn) return;
	const action = btn.dataset.action;
	const id = btn.dataset.id;
	if (action === 'delete') {
		if (!confirm('Are you sure you want to delete this post?')) return;
		try {
			const response = await fetch(`${API_URL}/posts/${id}`, {
				method: 'DELETE'
			});
			if (!response.ok) throw new Error('Failed to delete post');
			await getPosts();
			if (currentEditingId === id) resetForm(true);
		} catch (error) {
			console.error('Error deleting post:', error);
			alert(`Error deleting post: ${error.message}`);
		}
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
getPosts();
if (sortDateBtn) {
	sortDateBtn.addEventListener('click', async () => {
	   sortDirection = sortDirection === 'desc' ? 'asc' : 'desc';
	   console.log(`Sorting by date, direction: ${sortDirection}`);
	   await getPosts();
	});
}

document.querySelectorAll('#postsTable th[data-sort]')
.forEach(th => {


	th.addEventListener('click', () => {
		const field = th.dataset.sort;
		if (sortField === field) {
			sortDirection = sortDirection ===
			'asc' ? 'desc' : 'asc';
		} else {
			sortField = field;
			sortDirection = 'asc';
		}
		getPosts();
	})
});
getUsersAndCategories();
