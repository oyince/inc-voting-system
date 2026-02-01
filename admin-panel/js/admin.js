// admin-panel/js/admin.js
// Admin panel functionality for SQLiteCloud connection
// Location: INC-VOTING-SYSTEM/admin-panel/js/admin.js

const API_URL = "https://inc-voting-system.onrender.com";

// Helper function to handle API errors
function handleApiError(error, defaultMessage) {
  console.error('API Error:', error);
  return defaultMessage + (error.message ? ': ' + error.message : '');
}

// Check authentication status
async function checkAuth() {
  try {
    console.log('Checking authentication status...');
    const response = await fetch(`${API_URL}/admin/auth-status`, {
      credentials: "include",
    });
    const data = await response.json();
    console.log('Auth status:', data);

    if (data.authenticated) {
      document.getElementById("loginScreen").classList.add("hidden");
      document.getElementById("adminPanel").classList.remove("hidden");
      document.getElementById("currentUser").textContent = `👤 ${data.username}`;
      loadDashboard();
    }
  } catch (err) {
    console.error("Auth check failed:", err);
  }
}

// Login Form Handler
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const errorDiv = document.getElementById('loginError');

  console.log('Attempting login for user:', username);

  try {
    const res = await fetch(`${API_URL}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      credentials: "include",  
    });

    const data = await res.json();
    console.log('Login response:', data);

    if (res.ok) {
      console.log('Login successful, reloading...');
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
    if(errorDiv) {
      errorDiv.textContent = "Network error. Cannot connect to server.";
      errorDiv.classList.remove("hidden");
    } else {
      alert("Network error. Cannot connect to server.");
    }
  }
});

// Logout
async function logout() {
  try {
    await fetch(`${API_URL}/admin/logout`, {
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
  console.log('Showing section:', sectionName);
  
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
    console.log('Loading dashboard stats...');
    
    const response = await fetch(`${API_URL}/admin/stats`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const stats = await response.json();
    console.log('Stats loaded:', stats);
    
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
    document.getElementById('statsGrid').innerHTML = `
      <div class="alert alert-error">
        Failed to load statistics: ${error.message}
      </div>
    `;
  }
}

function loadDashboard() {
  console.log('Loading dashboard...');
  loadStats();
}

// Load delegates
async function loadDelegates() {
  const content = document.getElementById('delegatesContent');
  content.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading delegates...</p></div>';
  
  try {
    console.log('Fetching delegates...');
    
    const response = await fetch(`${API_URL}/admin/delegates`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Delegates data received:', data);
    
    if (!data.delegates || data.delegates.length === 0) {
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
        >
      </div>
      <div style="overflow-x: auto;">
        <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Token</th>
              <th>Zone</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="delegatesTableBody">
    `;
    
    data.delegates.forEach(d => {
      html += `
        <tr data-name="${(d.name || '').toLowerCase()}" data-token="${(d.token || '').toLowerCase()}">
          <td>${d.name || 'N/A'}</td>
          <td><code>${d.token || 'N/A'}</code></td>
          <td>${d.zone || '-'}</td>
          <td>
            ${d.has_voted ? 
              '<span class="badge badge-success">✓ Voted</span>' : 
              '<span class="badge badge-warning">Pending</span>'
            }
          </td>
          <td>
            <button onclick="viewDelegateQR(${d.id})" class="btn btn-sm">QR</button>
            <button onclick="editDelegate(${d.id})" class="btn btn-sm btn-success">Edit</button>
            <button onclick="deleteDelegate(${d.id})" class="btn btn-sm btn-danger">Delete</button>
          </td>
        </tr>
      `;
    });
    
    html += `
          </tbody>
        </table>
      </div>
    `;
    
    content.innerHTML = html;
  } catch (error) {
    console.error('Failed to load delegates:', error);
    content.innerHTML = `<div class="alert alert-error">Failed to load delegates: ${error.message}</div>`;
  }
}

// Filter delegates
function filterDelegates() {
  const searchTerm = document.getElementById('searchDelegates').value.toLowerCase();
  const rows = document.querySelectorAll('#delegatesTableBody tr');
  
  rows.forEach(row => {
    const name = row.getAttribute('data-name');
    const token = row.getAttribute('data-token');
    
    if (name.includes(searchTerm) || token.includes(searchTerm)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

// Show add delegate modal
function showAddDelegateModal() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h2 style="margin-bottom: 20px;">➕ Add New Delegate</h2>
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
          <label class="form-label">Zone</label>
          <select name="zone" class="form-select">
            <option value="">Select...</option>
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
            ➕ Add Delegate
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
      const response = await fetch(`${API_URL}/admin/delegates`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        modal.remove();
        loadDelegates();
        alert('Delegate added successfully!');
      } else {
        const errorData = await response.json();
        alert('Failed to add delegate: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  });
}

// View delegate QR code
async function viewDelegateQR(delegateId) {
  try {
    const response = await fetch(`${API_URL}/admin/delegates/${delegateId}`, {
      credentials: 'include'
    });
    const delegate = await response.json();
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content" style="text-align: center;">
        <h2>${delegate.name}</h2>
        <p style="color: #9ca3af; margin: 10px 0;">Token: <code>${delegate.token}</code></p>
        <img src="/qr-codes/${delegate.token}.png" style="max-width: 100%; margin: 20px 0;">
        <button onclick="this.closest('.modal').remove()" class="btn btn-primary" style="width: 100%;">
          Close
        </button>
      </div>
    `;
    document.body.appendChild(modal);
  } catch (error) {
    alert('Error loading QR code: ' + error.message);
  }
}

// Edit delegate
async function editDelegate(delegateId) {
  try {
    const response = await fetch(`${API_URL}/admin/delegates/${delegateId}`, {
      credentials: 'include'
    });
    const delegate = await response.json();
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h2 style="margin-bottom: 20px;">✏️ Edit Delegate</h2>
        <form id="editDelegateForm">
          <div class="form-group">
            <label class="form-label">Name *</label>
            <input type="text" name="name" value="${delegate.name || ''}" class="form-input" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">Gender</label>
            <select name="gender" class="form-select">
              <option value="">Select...</option>
              <option value="Male" ${delegate.gender === 'Male' ? 'selected' : ''}>Male</option>
              <option value="Female" ${delegate.gender === 'Female' ? 'selected' : ''}>Female</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Community</label>
            <input type="text" name="community" value="${delegate.community || ''}" class="form-input">
          </div>
          
          <div class="form-group">
            <label class="form-label">Zone</label>
            <select name="zone" class="form-select">
              <option value="">Select...</option>
              <option value="CENTRAL ZONE" ${delegate.zone === 'CENTRAL ZONE' ? 'selected' : ''}>CENTRAL ZONE</option>
              <option value="EASTERN ZONE" ${delegate.zone === 'EASTERN ZONE' ? 'selected' : ''}>EASTERN ZONE</option>
              <option value="WESTERN ZONE" ${delegate.zone === 'WESTERN ZONE' ? 'selected' : ''}>WESTERN ZONE</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Phone</label>
            <input type="tel" name="phone" value="${delegate.phone || ''}" class="form-input">
          </div>
          
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" name="email" value="${delegate.email || ''}" class="form-input">
          </div>
          
          <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button type="button" onclick="this.closest('.modal').remove()" class="btn" style="flex: 1; background: #4b5563;">
              Cancel
            </button>
            <button type="submit" class="btn btn-success" style="flex: 1;">
              💾 Update Delegate
            </button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('editDelegateForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);
      
      try {
        const response = await fetch(`${API_URL}/admin/delegates/${delegateId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (response.ok) {
          modal.remove();
          loadDelegates();
          alert('Delegate updated successfully!');
        } else {
          const errorData = await response.json();
          alert('Failed to update delegate: ' + (errorData.error || 'Unknown error'));
        }
      } catch (error) {
        alert('Error: ' + error.message);
      }
    });
    
  } catch (error) {
    alert('Error loading delegate: ' + error.message);
  }
}

// Delete delegate
async function deleteDelegate(id) {
  if (!confirm('Are you sure you want to delete this delegate? This will also delete their votes.')) return;
  
  try {
    const response = await fetch(`${API_URL}/admin/delegates/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (response.ok) {
      loadDelegates();
      loadStats();
      alert('Delegate deleted successfully');
    } else {
      const data = await response.json();
      alert('Failed to delete delegate: ' + (data.error || 'Unknown error'));
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// Show import modal
function showImportModal() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h2 style="margin-bottom: 20px;">📥 Import Delegates from CSV</h2>
      <div style="margin-bottom: 20px; padding: 15px; background: #374151; border-radius: 8px;">
        <h4 style="margin-bottom: 10px;">CSV Format:</h4>
        <code style="display: block; color: #10b981;">name,gender,community,zone,phone,email</code>
        <p style="margin-top: 10px; font-size: 14px; color: #9ca3af;">
          First row should be headers. Each subsequent row is one delegate.
        </p>
      </div>
      
      <textarea 
        id="csvData" 
        class="form-input" 
        style="min-height: 200px; font-family: monospace;"
        placeholder="name,gender,community,zone,phone,email
John Doe,Male,Community A,CENTRAL ZONE,08012345678,john@example.com
Jane Smith,Female,Community B,EASTERN ZONE,08087654321,jane@example.com"></textarea>
      
      <div style="display: flex; gap: 10px; margin-top: 20px;">
        <button type="button" onclick="this.closest('.modal').remove()" class="btn" style="flex: 1; background: #4b5563;">
          Cancel
        </button>
        <button onclick="processCSVImport()" class="btn btn-success" style="flex: 1;">
          📥 Import
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// Process CSV import
async function processCSVImport() {
  const csvData = document.getElementById('csvData').value.trim();
  
  if (!csvData) {
    alert('Please paste CSV data');
    return;
  }
  
  try {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const delegates = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',').map(v => v.trim());
      const delegate = {};
      
      headers.forEach((header, index) => {
        delegate[header] = values[index] || '';
      });
      
      if (delegate.name) {
        delegates.push(delegate);
      }
    }
    
    if (delegates.length === 0) {
      alert('No valid delegates found in CSV');
      return;
    }
    
    const response = await fetch(`${API_URL}/admin/delegates/import`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delegates })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      document.querySelector('.modal').remove();
      loadDelegates();
      alert(`Import complete! Imported: ${result.imported}, Skipped: ${result.skipped}`);
    } else {
      alert('Import failed: ' + (result.error || 'Unknown error'));
    }
    
  } catch (error) {
    alert('Error processing CSV: ' + error.message);
  }
}

// Load candidates
async function loadCandidates() {
  const content = document.getElementById('candidatesContent');
  content.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading candidates...</p></div>';
  
  try {
    console.log('Fetching candidates...');
    
    const response = await fetch(`${API_URL}/admin/candidates`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Candidates data received:', data);
    
    if (!data.candidates || data.candidates.length === 0) {
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
    
    // Group by position
    const byPosition = {};
    data.candidates.forEach(c => {
      const posTitle = c.position_title || 'Unknown Position';
      if (!byPosition[posTitle]) {
        byPosition[posTitle] = {
          zone: c.position_zone || c.zone,
          candidates: []
        };
      }
      byPosition[posTitle].candidates.push(c);
    });
    
    let html = '';
    Object.keys(byPosition).forEach(posTitle => {
      const posData = byPosition[posTitle];
      html += `
        <div style="background: #1f2937; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <div style="margin-bottom: 15px;">
            <span class="badge" style="background: #3b82f6;">${posData.zone}</span>
            <h3 style="margin: 8px 0 0 0;">${posTitle}</h3>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px;">
      `;
      
      posData.candidates.forEach(c => {
        html += `
          <div class="card" style="padding: 15px;">
            ${c.image_url ? 
              `<img src="${c.image_url}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;">` :
              `<div style="width: 100%; height: 200px; background: #374151; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                <span style="font-size: 48px;">👤</span>
              </div>`
            }
            <h4 style="margin-bottom: 8px;">${c.name}</h4>
            <p style="color: #9ca3af; font-size: 14px; margin-bottom: 10px;">
              ${c.gender || 'N/A'} • ${c.community || 'N/A'}
            </p>
            <div style="display: flex; gap: 5px;">
              <button onclick="editCandidate(${c.id})" class="btn btn-sm btn-success" style="flex: 1;">Edit</button>
              <button onclick="deleteCandidate(${c.id})" class="btn btn-sm btn-danger" style="flex: 1;">Delete</button>
            </div>
          </div>
        `;
      });
      
      html += `
          </div>
        </div>
      `;
    });
    
    content.innerHTML = html;
  } catch (error) {
    console.error('Failed to load candidates:', error);
    content.innerHTML = `<div class="alert alert-error">Failed to load candidates: ${error.message}</div>`;
  }
}

// Show add candidate modal
async function showAddCandidateModal() {
  try {
    const response = await fetch(`${API_URL}/admin/positions`, {
      credentials: 'include'
    });
    const positions = await response.json();
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h2 style="margin-bottom: 20px;">➕ Add New Candidate</h2>
        <form id="addCandidateForm" enctype="multipart/form-data">
          <div class="form-group">
            <label class="form-label">Name *</label>
            <input type="text" name="name" class="form-input" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">Position *</label>
            <select name="position_id" class="form-select" required>
              <option value="">Select position...</option>
              ${positions.map(p => `
                <option value="${p.id}">[${p.zone}] ${p.title}</option>
              `).join('')}
            </select>
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
            <label class="form-label">Photo</label>
            <input type="file" name="image" accept="image/*" class="form-input">
            <p style="font-size: 12px; color: #9ca3af; margin-top: 5px;">Maximum 5MB</p>
          </div>
          
          <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button type="button" onclick="this.closest('.modal').remove()" class="btn" style="flex: 1; background: #4b5563;">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" style="flex: 1;">
              ➕ Add Candidate
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
        const response = await fetch(`${API_URL}/admin/candidates`, {
          method: 'POST',
          credentials: 'include',
          body: formData
        });
        
        if (response.ok) {
          modal.remove();
          loadCandidates();
          alert('Candidate added successfully!');
        } else {
          const data = await response.json();
          alert('Failed to add candidate: ' + (data.error || 'Unknown error'));
        }
      } catch (error) {
        alert('Error: ' + error.message);
      }
    });
    
  } catch (error) {
    alert('Error loading positions: ' + error.message);
  }
}

// Edit candidate
async function editCandidate(candidateId) {
  try {
    const [candidateResponse, positionsResponse] = await Promise.all([
      fetch(`${API_URL}/admin/candidates/${candidateId}`, { credentials: 'include' }),
      fetch(`${API_URL}/admin/positions`, { credentials: 'include' })
    ]);
    
    const candidate = await candidateResponse.json();
    const positions = await positionsResponse.json();
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h2 style="margin-bottom: 20px;">✏️ Edit Candidate</h2>
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
        const response = await fetch(`${API_URL}/admin/candidates/${candidateId}`, {
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
    const response = await fetch(`${API_URL}/admin/candidates/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (response.ok) {
      loadCandidates();
      alert('Candidate deleted successfully');
    } else {
      const data = await response.json();
      alert('Failed to delete candidate: ' + (data.error || 'Unknown error'));
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
    const response = await fetch(`${API_URL}/admin/qr-codes/generate`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert(`Generated ${data.count} QR codes!`);
    } else {
      alert('Failed to generate QR codes: ' + (data.error || 'Unknown error'));
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
    const response = await fetch(`${API_URL}/admin/reset-votes`, {
      method: 'POST',
      credentials: 'include'
    });
    
    if (response.ok) {
      alert('All votes have been reset successfully');
      loadStats();
      loadResults();
    } else {
      const data = await response.json();
      alert('Failed to reset votes: ' + (data.error || 'Unknown error'));
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// Load results
async function loadResults() {
  const content = document.getElementById('resultsContent');
  content.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading results...</p></div>';
  
  try {
    console.log('Fetching results...');
    
    const response = await fetch(`${API_URL}/results`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const results = await response.json();
    console.log('Results data received:', results);
    
    let html = '';
    results.forEach(position => {
      const totalVotes = position.candidates.reduce((sum, c) => sum + (parseInt(c.vote_count) || 0), 0);
      const maxVotes = Math.max(...position.candidates.map(c => parseInt(c.vote_count) || 0));
      
      html += `
        <div style="background: #1f2937; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <div style="margin-bottom: 15px;">
            <span class="badge" style="background: #3b82f6;">${position.zone}</span>
            <h3 style="margin: 8px 0 0 0; font-size: 20px;">${position.position_title}</h3>
            <p style="color: #9ca3af; font-size: 14px;">Total votes: ${totalVotes}</p>
          </div>
      `;
      
      position.candidates.forEach(c => {
        const voteCount = parseInt(c.vote_count) || 0;
        const percentage = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : 0;
        const isWinning = voteCount === maxVotes && maxVotes > 0;
        
        html += `
          <div style="background: ${isWinning ? '#065f46' : '#374151'}; padding: 12px; border-radius: 6px; margin-bottom: 10px; border: ${isWinning ? '2px solid #10b981' : 'none'};">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-weight: bold;">${isWinning ? '🏆 ' : ''}${c.candidate_name}</span>
              <span style="font-weight: bold; font-size: 18px;">${voteCount}</span>
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
    console.error('Failed to load results:', error);
    content.innerHTML = `<div class="alert alert-error">Failed to load results: ${error.message}</div>`;
  }
}

// Initialize on page load
console.log('Admin panel JavaScript loaded');
checkAuth();