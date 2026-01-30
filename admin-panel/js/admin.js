// admin-panel/js/admin.js
// Admin panel functionality for SQLite

const API_BASE = "";

async function checkAuth() {
  try {
    const response = await fetch(`${API_BASE}/admin/auth-status`, {
      credentials: "include",
    });
    const data = await response.json();

    if (data.authenticated) {
      document.getElementById("loginScreen").classList.add("hidden");
      document.getElementById("adminPanel").classList.remove("hidden");
      document.getElementById("currentUser").textContent = `👤 ${data.username}`;
      loadDashboard();
    }
  } catch (err) {
    console.error("Auth check failed", err);
  }
}

// Logic for the Login Form
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const errorDiv = document.getElementById('loginError');

  try {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (res.ok) {
      location.reload();
    } else {
      if(errorDiv) {
        errorDiv.textContent = data.error || "Login failed";
        errorDiv.classList.remove("hidden");
      } else {
        alert(data.error || "Login failed");
      }
    }
  } catch (err) {
    console.error("Login error:", err);
  }
});

// Run on load
checkAuth();


// Login
app.post("/admin/login", async (req, res) => {
  console.log("LOGIN BODY:", req.body);

  const { username, password } = req.body;
  const user = await dbGet(
    "SELECT * FROM admin_users WHERE username = ?",
    [username]
  );

  console.log("DB USER:", user);

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  console.log(
    "PASSWORD MATCH:",
    bcrypt.compareSync(password, user.password_hash)
  );

  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  req.session.admin = { id: user.id, username: user.username };
  res.json({ success: true });
});

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('loginError');
  
  try {
    const response = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      window.location.reload();
    } else {
      errorDiv.textContent = data.error || 'Login failed';
      errorDiv.classList.remove('hidden');
    }
  } catch (error) {
    errorDiv.textContent = 'Network error. Please try again.';
    errorDiv.classList.remove('hidden');
  }
});

// Logout
async function logout() {
  try {
    await fetch(`${API_BASE}/admin/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    window.location.reload();
  } catch (error) {
    console.error('Logout failed:', error);
  }
}

// Show section
function showSection(sectionName) {
  document.querySelectorAll('.section').forEach(section => {
    section.classList.add('hidden');
  });
  
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const section = document.getElementById(`${sectionName}Section`);
  if (section) {
    section.classList.remove('hidden');
  }
  
  event.target.classList.add('active');
  
  switch(sectionName) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'delegates':
      loadDelegates();
      break;
    case 'candidates':
      loadCandidates();
      break;
    case 'results':
      loadResults();
      break;
  }
}

// Load dashboard stats
async function loadStats() {
  try {
    const response = await fetch(`${API_BASE}/admin/stats`, {
      credentials: 'include'
    });
    const stats = await response.json();
    
    const turnout = stats.total_delegates > 0 
      ? ((stats.voted_delegates / stats.total_delegates) * 100).toFixed(1)
      : 0;
    
    document.getElementById('statsGrid').innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Total Delegates</div>
        <div class="stat-value">${stats.total_delegates}</div>
      </div>
      <div class="stat-card success">
        <div class="stat-label">Delegates Voted</div>
        <div class="stat-value">${stats.voted_delegates}</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-label">Total Candidates</div>
        <div class="stat-value">${stats.total_candidates}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Votes Cast</div>
        <div class="stat-value">${stats.total_votes}</div>
      </div>
      <div class="stat-card success">
        <div class="stat-label">Turnout</div>
        <div class="stat-value">${turnout}%</div>
      </div>
    `;
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

function loadDashboard() {
  loadStats();
}

// Load delegates
async function loadDelegates() {
  const content = document.getElementById('delegatesContent');
  content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  
  try {
    const response = await fetch(`${API_BASE}/admin/delegates`, {
      credentials: 'include'
    });
    const data = await response.json();
    
    if (data.delegates.length === 0) {
      content.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #9ca3af;">
          <p style="font-size: 18px; margin-bottom: 20px;">No delegates yet</p>
          <button onclick="showAddDelegateModal()" class="btn btn-primary">
            ➕ Add Your First Delegate
          </button>
        </div>
      `;
      return;
    }
    
    let html = `
      <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
        <div style="color: #9ca3af;">
          Total: ${data.total} delegates
        </div>
        <input 
          type="text" 
          id="searchDelegates" 
          placeholder="Search by name or token..." 
          class="form-input"
          style="max-width: 300px;"
          onkeyup="filterDelegates()"
        />
      </div>
      <table class="table" id="delegatesTable">
        <thead>
          <tr>
            <th>Name</th>
            <th>Token</th>
            <th>Zone</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    data.delegates.forEach(delegate => {
      html += `
        <tr>
          <td>${delegate.name}</td>
          <td><code style="background: #374151; padding: 2px 6px; border-radius: 4px;">${delegate.token}</code></td>
          <td>${delegate.zone || 'N/A'}</td>
          <td>
            ${delegate.has_voted 
              ? '<span class="badge badge-success">Voted</span>' 
              : '<span class="badge badge-warning">Not Voted</span>'}
          </td>
          <td>
            <button onclick="deleteDelegate(${delegate.id})" class="btn btn-danger" style="padding: 6px 12px; font-size: 12px;">
              Delete
            </button>
          </td>
        </tr>
      `;
    });
    
    html += '</tbody></table>';
    content.innerHTML = html;
    
  } catch (error) {
    content.innerHTML = '<div class="alert alert-error">Failed to load delegates</div>';
  }
}

// Filter delegates
function filterDelegates() {
  const search = document.getElementById('searchDelegates').value.toLowerCase();
  const table = document.getElementById('delegatesTable');
  const rows = table.getElementsByTagName('tr');
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(search) ? '' : 'none';
  }
}

// Show add delegate modal
function showAddDelegateModal() {
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Add Delegate</h3>
        <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
      </div>
      <form id="addDelegateForm">
        <div class="form-group">
          <label class="form-label">Name *</label>
          <input type="text" name="name" class="form-input" required>
        </div>
        <div class="form-group">
          <label class="form-label">Gender</label>
          <select name="gender" class="form-select">
            <option value="">Select...</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Community</label>
          <input type="text" name="community" class="form-input">
        </div>
        <div class="form-group">
          <label class="form-label">Zone *</label>
          <select name="zone" class="form-select" required>
            <option value="">Select Zone...</option>
            <option value="CENTRAL ZONE">CENTRAL ZONE</option>
            <option value="EASTERN ZONE">EASTERN ZONE</option>
            <option value="WESTERN ZONE">WESTERN ZONE</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Phone</label>
          <input type="tel" name="phone" class="form-input">
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" name="email" class="form-input">
        </div>
        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button type="button" onclick="this.closest('.modal').remove()" class="btn" style="flex: 1; background: #4b5563;">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" style="flex: 1;">
            Add Delegate
          </button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  
  document.getElementById('addDelegateForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
      const response = await fetch(`${API_BASE}/admin/delegates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        modal.remove();
        loadDelegates();
        const result = await response.json();
        alert('Delegate added successfully! Token: ' + result.delegate.token);
      } else {
        alert('Failed to add delegate');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  });
}

// Show import modal
function showImportModal() {
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Import Delegates from CSV/Excel</h3>
        <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
      </div>
      
      <div class="alert alert-info" style="margin: 20px;">
        <strong>Required columns:</strong> name, zone<br>
        <strong>Optional columns:</strong> gender, community, phone, email<br>
        <strong>Note:</strong> Tokens will be auto-generated
      </div>
      
      <div style="padding: 0 20px 20px 20px;">
        <a href="#" onclick="downloadDelegateTemplate(); return false;" style="color: #3b82f6; text-decoration: underline;">
          📥 Download CSV Template
        </a>
      </div>
      
      <form id="importForm" style="padding: 20px;">
        <div class="file-upload" onclick="document.getElementById('fileInput').click()">
          <input type="file" id="fileInput" accept=".csv,.xlsx,.xls" style="display: none;" required>
          <p style="margin: 0;">📁 Click to select CSV or Excel file</p>
          <p id="fileName" style="margin: 8px 0 0 0; color: #9ca3af; font-size: 14px;"></p>
        </div>
        
        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button type="button" onclick="this.closest('.modal').remove()" class="btn" style="flex: 1; background: #4b5563;">
            Cancel
          </button>
          <button type="submit" class="btn btn-success" style="flex: 1;">
            Import Delegates
          </button>
        </div>
      </form>
      
      <div id="importProgress" class="hidden" style="margin: 20px;">
        <div class="loading"><div class="spinner"></div></div>
        <p style="text-align: center; color: #9ca3af; margin-top: 10px;">Importing...</p>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  document.getElementById('fileInput').addEventListener('change', (e) => {
    const fileName = e.target.files[0]?.name;
    if (fileName) {
      document.getElementById('fileName').textContent = `Selected: ${fileName}`;
    }
  });
  
  document.getElementById('importForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fileInput = document.getElementById('fileInput');
    if (!fileInput.files[0]) {
      alert('Please select a file');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    
    document.getElementById('importProgress').classList.remove('hidden');
    
    try {
      const response = await fetch(`${API_BASE}/admin/delegates/import`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      const data = await response.json();
      
      if (response.ok) {
        modal.remove();
        loadDelegates();
        alert(`Successfully imported ${data.count} delegates!`);
      } else {
        alert('Import failed: ' + data.error);
        document.getElementById('importProgress').classList.add('hidden');
      }
    } catch (error) {
      alert('Error: ' + error.message);
      document.getElementById('importProgress').classList.add('hidden');
    }
  });
}

// Download delegate template
function downloadDelegateTemplate() {
  const csv = `name,gender,community,zone,phone,email
Chief John Owei,Male,Oporoma,CENTRAL ZONE,08012345678,john@example.com
Dr. Mary Ebiere,Female,Yenagoa,EASTERN ZONE,08098765432,mary@example.com
Hon. Peter George,Male,Sagbama,WESTERN ZONE,08123456789,peter@example.com`;
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'delegates_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// Delete delegate
async function deleteDelegate(id) {
  if (!confirm('Are you sure you want to delete this delegate?')) return;
  
  try {
    const response = await fetch(`${API_BASE}/admin/delegates/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (response.ok) {
      loadDelegates();
      alert('Delegate deleted successfully');
    } else {
      alert('Failed to delete delegate');
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// Load candidates
async function loadCandidates() {
  const content = document.getElementById('candidatesContent');
  content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  
  try {
    const response = await fetch(`${API_BASE}/admin/candidates`, {
      credentials: 'include'
    });
    const candidates = await response.json();
    
    if (candidates.length === 0) {
      content.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #9ca3af;">
          <p style="font-size: 18px; margin-bottom: 20px;">No candidates yet</p>
          <button onclick="showAddCandidateModal()" class="btn btn-primary">
            ➕ Add Your First Candidate
          </button>
        </div>
      `;
      return;
    }
    
    const positions = {};
    candidates.forEach(c => {
      if (!positions[c.position_title]) {
        positions[c.position_title] = {
          zone: c.position_zone,
          candidates: []
        };
      }
      positions[c.position_title].candidates.push(c);
    });
    
    let html = '';
    Object.keys(positions).forEach(title => {
      const pos = positions[title];
      html += `
        <div style="background: #374151; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <div>
              <span class="badge" style="background: #3b82f6;">${pos.zone}</span>
              <h3 style="margin: 8px 0 0 0; font-size: 20px;">${title}</h3>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
      `;
      
      pos.candidates.forEach(c => {
        html += `
          <div style="background: #1f2937; padding: 15px; border-radius: 8px; text-align: center;">
            ${c.image_url ? `<img src="${c.image_url}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 10px;">` : ''}
            <div style="font-weight: bold; margin-bottom: 5px;">${c.name}</div>
            <div style="font-size: 12px; color: #9ca3af; margin-bottom: 10px;"></div>
            <div style="display: flex; gap: 5px;">
              <button onclick="showEditCandidateModal(${c.id})" class="btn" style="flex: 1; padding: 6px; font-size: 12px; background: #3b82f6;">
                ✏️ Edit
              </button>
              <button onclick="deleteCandidate(${c.id})" class="btn btn-danger" style="flex: 1; padding: 6px; font-size: 12px;">
                🗑️ Delete
              </button>
            </div>
          </div>
        `;
      });
      
      html += '</div></div>';
    });
    
    content.innerHTML = html;
    
  } catch (error) {
    content.innerHTML = '<div class="alert alert-error">Failed to load candidates</div>';
  }
}

// Show add candidate modal
async function showAddCandidateModal() {
  const positionsResp = await fetch(`${API_BASE}/admin/positions`, {
    credentials: 'include'
  });
  const positions = await positionsResp.json();
  
  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Add Candidate</h3>
        <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
      </div>
      <form id="addCandidateForm">
        <div class="form-group">
          <label class="form-label">Position *</label>
          <select name="position_id" class="form-select" required>
            <option value="">Select Position...</option>
            ${positions.map(p => `<option value="${p.id}">[${p.zone}] ${p.title}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Name *</label>
          <input type="text" name="name" class="form-input" required>
        </div>
        <div class="form-group">
          <label class="form-label">Gender</label>
          <select name="gender" class="form-select">
            <option value="">Select...</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Community</label>
          <input type="text" name="community" class="form-input">
        </div>
        <div class="form-group">
          <label class="form-label">Zone</label>
          <select name="zone" class="form-select">
            <option value="">Select...</option>
            <option value="CENTRAL ZONE">CENTRAL ZONE</option>
            <option value="EASTERN ZONE">EASTERN ZONE</option>
            <option value="WESTERN ZONE">WESTERN ZONE</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Photo (optional)</label>
          <input type="file" name="image" accept="image/*" class="form-input">
          <p style="font-size: 12px; color: #9ca3af; margin-top: 5px;">Maximum 5MB</p>
        </div>
        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button type="button" onclick="this.closest('.modal').remove()" class="btn" style="flex: 1; background: #4b5563;">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" style="flex: 1;">
            Add Candidate
          </button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  
  document.getElementById('addCandidateForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      const response = await fetch(`${API_BASE}/admin/candidates`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      if (response.ok) {
        modal.remove();
        loadCandidates();
        alert('Candidate added successfully!');
      } else {
        alert('Failed to add candidate');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  });
}

// Show edit candidate modal
async function showEditCandidateModal(candidateId) {
  try {
    // Get candidate details
    const candidatesResp = await fetch(`${API_BASE}/admin/candidates`, {
      credentials: 'include'
    });
    const candidates = await candidatesResp.json();
    const candidate = candidates.find(c => c.id === candidateId);
    
    if (!candidate) {
      alert('Candidate not found');
      return;
    }
    
    // Get positions list
    const positionsResp = await fetch(`${API_BASE}/admin/positions`, {
      credentials: 'include'
    });
    const positions = await positionsResp.json();
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Edit Candidate</h3>
          <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
        </div>
        <form id="editCandidateForm">
          <div class="form-group">
            <label class="form-label">Name (Cannot be changed)</label>
            <input type="text" value="${candidate.name}" class="form-input" disabled style="background: #374151; cursor: not-allowed;">
            <p style="font-size: 12px; color: #9ca3af; margin-top: 5px;">Delete and create new candidate to change name</p>
          </div>
          
          <div class="form-group">
            <label class="form-label">Position</label>
            <select name="position_id" class="form-select">
              ${positions.map(p => `
                <option value="${p.id}" ${p.id === candidate.position_id ? 'selected' : ''}>
                  [${p.zone}] ${p.title}
                </option>
              `).join('')}
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Gender</label>
            <select name="gender" class="form-select">
              <option value="">Select...</option>
              <option value="Male" ${candidate.gender === 'Male' ? 'selected' : ''}>Male</option>
              <option value="Female" ${candidate.gender === 'Female' ? 'selected' : ''}>Female</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Community</label>
            <input type="text" name="community" value="${candidate.community || ''}" class="form-input">
          </div>
          
          <div class="form-group">
            <label class="form-label">Zone</label>
            <select name="zone" class="form-select">
              <option value="">Select...</option>
              <option value="CENTRAL ZONE" ${candidate.zone === 'CENTRAL ZONE' ? 'selected' : ''}>CENTRAL ZONE</option>
              <option value="EASTERN ZONE" ${candidate.zone === 'EASTERN ZONE' ? 'selected' : ''}>EASTERN ZONE</option>
              <option value="WESTERN ZONE" ${candidate.zone === 'WESTERN ZONE' ? 'selected' : ''}>WESTERN ZONE</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Current Photo</label>
            ${candidate.image_url ? `
              <div style="text-align: center; margin-bottom: 10px;">
                <img src="${candidate.image_url}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover;">
              </div>
            ` : `
              <div style="text-align: center; padding: 20px; background: #374151; border-radius: 8px; margin-bottom: 10px;">
                <p style="color: #9ca3af;">No photo uploaded</p>
              </div>
            `}
            <label class="form-label">Upload New Photo (optional)</label>
            <input type="file" name="image" accept="image/*" class="form-input">
            <p style="font-size: 12px; color: #9ca3af; margin-top: 5px;">Leave empty to keep current photo. Maximum 5MB</p>
          </div>
          
          <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button type="button" onclick="this.closest('.modal').remove()" class="btn" style="flex: 1; background: #4b5563;">
              Cancel
            </button>
            <button type="submit" class="btn btn-success" style="flex: 1;">
              💾 Update Candidate
            </button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('editCandidateForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      
      try {
        const response = await fetch(`${API_BASE}/admin/candidates/${candidateId}`, {
          method: 'PUT',
          credentials: 'include',
          body: formData
        });
        
        if (response.ok) {
          modal.remove();
          loadCandidates();
          alert('Candidate updated successfully!');
        } else {
          const data = await response.json();
          alert('Failed to update candidate: ' + (data.error || 'Unknown error'));
        }
      } catch (error) {
        alert('Error: ' + error.message);
      }
    });
    
  } catch (error) {
    alert('Error loading candidate: ' + error.message);
  }
}

// Delete candidate
async function deleteCandidate(id) {
  if (!confirm('Are you sure you want to delete this candidate?')) return;
  
  try {
    const response = await fetch(`${API_BASE}/admin/candidates/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (response.ok) {
      loadCandidates();
      alert('Candidate deleted successfully');
    } else {
      alert('Failed to delete candidate');
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// Generate QR codes
async function generateAllQR() {
  if (!confirm('Generate QR codes for all delegates?')) return;
  
  const btn = event.target;
  btn.disabled = true;
  btn.textContent = 'Generating...';
  
  try {
    const response = await fetch(`${API_BASE}/admin/qr-codes/generate`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert(`Generated ${data.count} QR codes!`);
      if (confirm('View/Download all QR codes?')) {
        window.open(`${API_BASE}/admin/qr-codes/download-all`, '_blank');
      }
    } else {
      alert('Failed to generate QR codes');
    }
  } catch (error) {
    alert('Error: ' + error.message);
  } finally {
    btn.disabled = false;
    btn.textContent = '🎨 Generate QR Codes';
  }
}

// Confirm reset votes
function confirmResetVotes() {
  if (confirm('⚠️ WARNING: This will delete ALL votes and reset ALL delegates. Are you sure?')) {
    if (confirm('This action CANNOT be undone. Type YES to confirm.')) {
      resetVotes();
    }
  }
}

// Reset votes
async function resetVotes() {
  try {
    const response = await fetch(`${API_BASE}/admin/reset-votes`, {
      method: 'POST',
      credentials: 'include'
    });
    
    if (response.ok) {
      alert('All votes have been reset successfully');
      loadStats();
    } else {
      alert('Failed to reset votes');
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// Load results
async function loadResults() {
  const content = document.getElementById('resultsContent');
  content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  
  try {
    const response = await fetch(`${API_BASE}/results`);
    const results = await response.json();
    
    let html = '';
    results.forEach(position => {
      const totalVotes = position.candidates.reduce((sum, c) => sum + c.vote_count, 0);
      const maxVotes = Math.max(...position.candidates.map(c => c.vote_count));
      
      html += `
        <div style="background: #1f2937; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <div style="margin-bottom: 15px;">
            <span class="badge" style="background: #3b82f6;">${position.zone}</span>
            <h3 style="margin: 8px 0 0 0; font-size: 20px;">${position.position_title}</h3>
            <p style="color: #9ca3af; font-size: 14px;">Total votes: ${totalVotes}</p>
          </div>
      `;
      
      position.candidates.forEach(c => {
        const percentage = totalVotes > 0 ? ((c.vote_count / totalVotes) * 100).toFixed(1) : 0;
        const isWinning = c.vote_count === maxVotes && maxVotes > 0;
        
        html += `
          <div style="background: ${isWinning ? '#065f46' : '#374151'}; padding: 12px; border-radius: 6px; margin-bottom: 10px; border: ${isWinning ? '2px solid #10b981' : 'none'};">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-weight: bold;">${isWinning ? '🏆 ' : ''}${c.candidate_name}</span>
              <span style="font-weight: bold; font-size: 18px;">${c.vote_count}</span>
            </div>
            <div style="height: 8px; background: #1f2937; border-radius: 4px; overflow: hidden;">
              <div style="height: 100%; width: ${percentage}%; background: ${isWinning ? '#10b981' : '#3b82f6'}; transition: width 0.5s;"></div>
            </div>
            <div style="color: #9ca3af; font-size: 12px; margin-top: 4px;">${percentage}%</div>
          </div>
        `;
      });
      
      html += '</div>';
    });
    
    content.innerHTML = html || '<p style="text-align: center; color: #9ca3af;">No votes yet</p>';
    
  } catch (error) {
    content.innerHTML = '<div class="alert alert-error">Failed to load results</div>';
  }
}

// Initialize
checkAuth();