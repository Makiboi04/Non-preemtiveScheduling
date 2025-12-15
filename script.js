// State Management
let processes = []
let history = []
let historyIndex = -1
let simulationRunning = false
let simulationPaused = false
let currentTime = 0
let animationInterval = null
let animationSpeed = 1000
let currentSortColumn = -1
let currentSortDirection = "asc"
let currentSchedule = null
let scheduleStep = 0

const processColors = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#06b6d4",
  "#f43f5e",
  "#84cc16",
  "#6366f1",
]

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  initializeSampleData()
  updateSpeedDisplay()
  updateHeaderBackground() // Call on page load to set initial header background

  // Speed slider listener
  document.getElementById("speedSlider").addEventListener("input", (e) => {
    animationSpeed = 2100 - Number.parseInt(e.target.value)
    updateSpeedDisplay()
  })

  // Algorithm change listener
  document.getElementById("algorithm").addEventListener("change", (e) => {
    const quantumGroup = document.getElementById("quantumGroup")
    if (e.target.value === "rr") {
      quantumGroup.style.display = "block"
    } else {
      quantumGroup.style.display = "none"
    }
  })
})

// Sample Data Initialization
function initializeSampleData() {
  const samples = [
    { id: "P1", arrival: 0, burst: 5, priority: 2 },
    { id: "P2", arrival: 1, burst: 3, priority: 1 },
    { id: "P3", arrival: 2, burst: 8, priority: 3 },
    { id: "P4", arrival: 3, burst: 6, priority: 4 },
  ]

  samples.forEach((p) => {
    processes.push({
      ...p,
      color: processColors[processes.length % processColors.length],
    })
  })

  saveState()
  renderProcessList()
  updateProcessCount()
}

// History Management
function saveState() {
  const state = JSON.parse(JSON.stringify(processes))
  history = history.slice(0, historyIndex + 1)
  history.push(state)
  historyIndex++
  updateUndoRedoButtons()
}

function undo() {
  if (historyIndex > 0) {
    historyIndex--
    processes = JSON.parse(JSON.stringify(history[historyIndex]))
    renderProcessList()
    updateUndoRedoButtons()
    updateProcessCount()
  }
}

function redo() {
  if (historyIndex < history.length - 1) {
    historyIndex++
    processes = JSON.parse(JSON.stringify(history[historyIndex]))
    renderProcessList()
    updateUndoRedoButtons()
    updateProcessCount()
  }
}

function updateUndoRedoButtons() {
  document.getElementById("undoBtn").disabled = historyIndex <= 0
  document.getElementById("redoBtn").disabled = historyIndex >= history.length - 1
}

// Theme Toggle
function toggleTheme() {
  document.body.classList.toggle("dark-mode")
  const icon = document.getElementById("themeIcon")
  icon.textContent = document.body.classList.contains("dark-mode") ? "☀️" : "🌙"
  updateHeaderBackground()
}

function updateHeaderBackground() {
  const header = document.querySelector(".header")
  if (header) {
    const bgColor = getComputedStyle(document.body).getPropertyValue("--bg-primary").trim()
    header.style.backgroundColor = bgColor
  }
}

// Sidebar Toggle
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("collapsed")
}

// Error Handling
function showError(message) {
  const errorContainer = document.getElementById("errorContainer")
  errorContainer.innerHTML = `<div class="error">${message}</div>`
  setTimeout(() => {
    errorContainer.innerHTML = ""
  }, 4000)
}

// Process Management
function addProcess() {
  const id = document.getElementById("processId").value.trim()
  const arrival = Number.parseInt(document.getElementById("arrivalTime").value)
  const burst = Number.parseInt(document.getElementById("burstTime").value)
  const priority = Number.parseInt(document.getElementById("priority").value)

  if (!id) {
    showError("Please enter a Process ID")
    return
  }

  if (processes.some((p) => p.id === id)) {
    showError(`Process ${id} already exists`)
    return
  }

  if (isNaN(arrival) || arrival < 0) {
    showError("Arrival time must be a non-negative number")
    return
  }

  if (isNaN(burst) || burst < 1) {
    showError("Burst time must be a positive number")
    return
  }

  if (isNaN(priority) || priority < 1) {
    showError("Priority must be a positive number")
    return
  }

  const newProcess = {
    id,
    arrival,
    burst,
    priority,
    color: processColors[processes.length % processColors.length],
  }

  processes.push(newProcess)
  saveState()
  renderProcessList()
  updateProcessCount()

  // Clear inputs
  document.getElementById("processId").value = ""
  document.getElementById("arrivalTime").value = "0"
  document.getElementById("burstTime").value = "1"
  document.getElementById("priority").value = "1"
}

function deleteProcess(index) {
  processes.splice(index, 1)
  saveState()
  renderProcessList()
  updateProcessCount()
}

function clearAllProcesses() {
  if (processes.length === 0) return

  if (confirm("Are you sure you want to clear all processes?")) {
    processes = []
    saveState()
    renderProcessList()
    updateProcessCount()
  }
}

function renderProcessList() {
  const container = document.getElementById("processItems")

  if (processes.length === 0) {
    container.innerHTML = '<div class="empty-state">No processes added yet</div>'
    return
  }

  container.innerHTML = processes
    .map(
      (proc, index) => `
        <div class="process-item">
            <div class="process-info">
                <div class="process-label">
                    <span class="process-color-indicator" style="background: ${proc.color}"></span>
                    ${proc.id}
                </div>
                <div class="process-details">
                    <span class="process-detail-item">
                        <span class="process-detail-label">AT:</span> ${proc.arrival}
                    </span>
                    <span class="process-detail-item">
                        <span class="process-detail-label">BT:</span> ${proc.burst}
                    </span>
                    <span class="process-detail-item">
                        <span class="process-detail-label">P:</span> ${proc.priority}
                    </span>
                </div>
            </div>
            <div class="process-actions">
                <button class="btn-danger btn-icon btn-sm" onclick="deleteProcess(${index})" title="Delete">✕</button>
            </div>
        </div>
    `,
    )
    .join("")
}

function updateProcessCount() {
  document.getElementById("processCount").textContent = processes.length
}

function updateSpeedDisplay() {
  const speed = (2100 - animationSpeed) / 1000
  document.getElementById("speedValue").textContent = `${speed.toFixed(1)}x`
}

// Simulation Control
function startSimulation() {
  if (processes.length === 0) {
    showError("Please add at least one process")
    return
  }

  if (simulationRunning) return

  simulationRunning = true
  simulationPaused = false
  currentTime = 0
  scheduleStep = 0

  document.getElementById("startBtn").disabled = true
  document.getElementById("pauseBtn").disabled = false
  document.getElementById("resetBtn").disabled = false
  document.getElementById("resultsTable").style.display = "none"

  const algorithm = document.getElementById("algorithm").value
  const quantum = Number.parseInt(document.getElementById("timeQuantum").value) || 2

  let schedule
  switch (algorithm) {
    case "fcfs":
      schedule = scheduleFCFS()
      break
    case "sjf":
      schedule = scheduleSJF()
      break
    case "priority":
      schedule = schedulePriority()
      break
    case "rr":
      schedule = scheduleRoundRobin(quantum)
      break
    default:
      schedule = scheduleFCFS()
  }

  currentSchedule = schedule
  animateSimulation(schedule)
}

function pauseSimulation() {
  if (!simulationRunning || simulationPaused) return

  simulationPaused = true
  clearInterval(animationInterval)

  document.getElementById("pauseBtn").disabled = true
  document.getElementById("resumeBtn").disabled = false
  document.getElementById("pausedIndicator").style.display = "inline-flex"
}

function resumeSimulation() {
  if (!simulationRunning || !simulationPaused) return

  simulationPaused = false

  document.getElementById("pauseBtn").disabled = false
  document.getElementById("resumeBtn").disabled = true
  document.getElementById("pausedIndicator").style.display = "none"

  if (currentSchedule) {
    continueAnimation(currentSchedule)
  }
}

function resetSimulation() {
  clearInterval(animationInterval)

  simulationRunning = false
  simulationPaused = false
  currentTime = 0
  currentSchedule = null
  scheduleStep = 0

  document.getElementById("startBtn").disabled = false
  document.getElementById("pauseBtn").disabled = true
  document.getElementById("resumeBtn").disabled = true
  document.getElementById("resetBtn").disabled = false
  document.getElementById("pausedIndicator").style.display = "none"
  document.getElementById("clock").textContent = "0"

  document.getElementById("readyQueue").innerHTML = '<div class="empty-state">No processes in queue</div>'
  document.getElementById("cpuExecution").innerHTML = '<div class="empty-state">Idle</div>'
  document.getElementById("completedQueue").innerHTML = '<div class="empty-state">No completed processes</div>'
  document.getElementById("ganttChart").innerHTML = '<div class="empty-state">Start simulation to see Gantt chart</div>'
  document.getElementById("legend").innerHTML = ""
  document.getElementById("resultsTable").style.display = "none"

  updateQueueCounts()
}

// Scheduling Algorithms
function scheduleFCFS() {
  const sorted = [...processes].sort((a, b) => a.arrival - b.arrival)
  const schedule = []
  let time = 0

  sorted.forEach((proc) => {
    const start = Math.max(time, proc.arrival)
    const end = start + proc.burst

    schedule.push({
      process: proc.id,
      start,
      end,
      color: proc.color,
    })

    time = end
  })

  return schedule
}

function scheduleSJF() {
  const sorted = [...processes].sort((a, b) => {
    if (a.arrival === b.arrival) return a.burst - b.burst
    return a.arrival - b.arrival
  })

  const schedule = []
  const remaining = [...sorted]
  let time = 0

  while (remaining.length > 0) {
    const available = remaining.filter((p) => p.arrival <= time)

    if (available.length === 0) {
      time = remaining[0].arrival
      continue
    }

    available.sort((a, b) => a.burst - b.burst)
    const proc = available[0]
    const start = time
    const end = start + proc.burst

    schedule.push({
      process: proc.id,
      start,
      end,
      color: proc.color,
    })

    time = end
    remaining.splice(remaining.indexOf(proc), 1)
  }

  return schedule
}

function schedulePriority() {
  const sorted = [...processes].sort((a, b) => {
    if (a.arrival === b.arrival) return a.priority - b.priority
    return a.arrival - b.arrival
  })

  const schedule = []
  const remaining = [...sorted]
  let time = 0

  while (remaining.length > 0) {
    const available = remaining.filter((p) => p.arrival <= time)

    if (available.length === 0) {
      time = remaining[0].arrival
      continue
    }

    available.sort((a, b) => a.priority - b.priority)
    const proc = available[0]
    const start = time
    const end = start + proc.burst

    schedule.push({
      process: proc.id,
      start,
      end,
      color: proc.color,
    })

    time = end
    remaining.splice(remaining.indexOf(proc), 1)
  }

  return schedule
}

function scheduleRoundRobin(quantum) {
  const schedule = []
  const queue = []
  const remaining = processes.map((p) => ({
    ...p,
    remainingBurst: p.burst,
    inQueue: false,
  }))

  let time = 0
  const currentIndex = 0

  remaining.forEach((p) => {
    if (p.arrival <= time && !p.inQueue) {
      queue.push(p)
      p.inQueue = true
    }
  })

  while (queue.length > 0 || remaining.some((p) => p.remainingBurst > 0)) {
    remaining.forEach((p) => {
      if (p.arrival <= time && !p.inQueue && p.remainingBurst > 0) {
        queue.push(p)
        p.inQueue = true
      }
    })

    if (queue.length === 0) {
      time++
      continue
    }

    const proc = queue.shift()
    proc.inQueue = false

    const execTime = Math.min(quantum, proc.remainingBurst)
    const start = time
    const end = start + execTime

    schedule.push({
      process: proc.id,
      start,
      end,
      color: proc.color,
    })

    proc.remainingBurst -= execTime
    time = end

    remaining.forEach((p) => {
      if (p.arrival <= time && !p.inQueue && p.remainingBurst > 0) {
        queue.push(p)
        p.inQueue = true
      }
    })

    if (proc.remainingBurst > 0) {
      queue.push(proc)
      proc.inQueue = true
    }
  }

  return schedule
}

// Animation
function animateSimulation(schedule) {
  scheduleStep = 0
  const maxTime = Math.max(...schedule.map((s) => s.end))

  renderGanttChart(schedule)
  renderLegend()

  animationInterval = setInterval(() => {
    if (simulationPaused) return

    if (currentTime >= maxTime) {
      clearInterval(animationInterval)
      simulationRunning = false
      showResults(schedule)
      document.getElementById("startBtn").disabled = false
      document.getElementById("pauseBtn").disabled = true
      document.getElementById("resetBtn").disabled = false
      return
    }

    updateQueues(schedule, currentTime)
    const clockElement = document.getElementById("clock")
    clockElement.textContent = currentTime
    clockElement.style.animation = "none"
    setTimeout(() => {
      clockElement.style.animation = "scaleValue 0.5s ease"
    }, 10)
    currentTime++
  }, animationSpeed)
}

function continueAnimation(schedule) {
  const maxTime = Math.max(...schedule.map((s) => s.end))

  animationInterval = setInterval(() => {
    if (simulationPaused) return

    if (currentTime >= maxTime) {
      clearInterval(animationInterval)
      simulationRunning = false
      showResults(schedule)
      document.getElementById("startBtn").disabled = false
      document.getElementById("pauseBtn").disabled = true
      document.getElementById("resetBtn").disabled = false
      return
    }

    updateQueues(schedule, currentTime)
    const clockElement = document.getElementById("clock")
    clockElement.textContent = currentTime
    clockElement.style.animation = "none"
    setTimeout(() => {
      clockElement.style.animation = "scaleValue 0.5s ease"
    }, 10)
    currentTime++
  }, animationSpeed)
}

function updateQueues(schedule, time) {
  const readyQueue = document.getElementById("readyQueue")
  const cpuExecution = document.getElementById("cpuExecution")
  const completedQueue = document.getElementById("completedQueue")

  const executing = schedule.find((s) => s.start <= time && s.end > time)

  const ready = processes.filter((p) => {
    const inSchedule = schedule.find((s) => s.process === p.id)
    return p.arrival <= time && (!inSchedule || inSchedule.start > time)
  })

  const completed = schedule.filter((s) => s.end <= time)
  const uniqueCompleted = [...new Set(completed.map((s) => s.process))]

  if (ready.length === 0) {
    readyQueue.innerHTML = '<div class="empty-state">No processes in queue</div>'
  } else {
    readyQueue.innerHTML = ready
      .map(
        (p) =>
          `<div class="process-block" style="background: ${p.color}">
                <div class="process-block-label">${p.id}</div>
                <div class="process-block-info">BT: ${p.burst}</div>
            </div>`,
      )
      .join("")
  }

  if (executing) {
    const proc = processes.find((p) => p.id === executing.process)
    cpuExecution.innerHTML = `
            <div class="process-block cpu-executing" style="background: ${executing.color}">
                <div class="process-block-label">${executing.process}</div>
                <div class="process-block-info">${time - executing.start + 1}/${executing.end - executing.start}</div>
            </div>
        `
  } else {
    cpuExecution.innerHTML = '<div class="empty-state">Idle</div>'
  }

  if (uniqueCompleted.length === 0) {
    completedQueue.innerHTML = '<div class="empty-state">No completed processes</div>'
  } else {
    completedQueue.innerHTML = uniqueCompleted
      .map((pid) => {
        const proc = processes.find((p) => p.id === pid)
        return `<div class="process-block" style="background: ${proc.color}">
                <div class="process-block-label">${pid}</div>
            </div>`
      })
      .join("")
  }

  updateQueueCounts()
}

function updateQueueCounts() {
  const ready = document.getElementById("readyQueue").querySelectorAll(".process-block").length
  const completed = document.getElementById("completedQueue").querySelectorAll(".process-block").length

  document.getElementById("readyCount").textContent = ready
  document.getElementById("completedCount").textContent = completed
}

function renderGanttChart(schedule) {
  const container = document.getElementById("ganttChart")
  const maxTime = Math.max(...schedule.map((s) => s.end))

  const ganttHTML = `
        <div class="gantt-row">
            ${schedule
              .map(
                (s) => `
                <div class="gantt-cell" 
                     style="background: ${s.color}; flex: ${s.end - s.start}"
                     title="${s.process}: ${s.start} - ${s.end}">
                    ${s.process}
                </div>
            `,
              )
              .join("")}
        </div>
        <div class="gantt-timeline">
            ${Array.from({ length: maxTime + 1 }, (_, i) => `<div class="gantt-time">${i}</div>`).join("")}
        </div>
    `

  container.innerHTML = ganttHTML
}

function renderLegend() {
  const legend = document.getElementById("legend")
  legend.innerHTML = processes
    .map(
      (p) => `
        <div class="legend-item">
            <div class="legend-color" style="background: ${p.color}"></div>
            <span class="legend-label">${p.id}</span>
        </div>
    `,
    )
    .join("")
}

function showResults(schedule) {
  const results = calculateResults(schedule)
  const tbody = document.getElementById("resultsBody")

  tbody.innerHTML = results
    .map(
      (r) => `
        <tr>
            <td><strong>${r.process}</strong></td>
            <td>${r.arrival}</td>
            <td>${r.burst}</td>
            <td>${r.completion}</td>
            <td>${r.turnaround}</td>
            <td>${r.waiting}</td>
        </tr>
    `,
    )
    .join("")

  const avgWaiting = results.reduce((sum, r) => sum + r.waiting, 0) / results.length
  const avgTurnaround = results.reduce((sum, r) => sum + r.turnaround, 0) / results.length
  const maxTime = Math.max(...schedule.map((s) => s.end))
  const totalBurst = results.reduce((sum, r) => sum + r.burst, 0)
  const cpuUtil = (totalBurst / maxTime) * 100
  const throughput = results.length / maxTime

  document.getElementById("avgWaitingTime").textContent = avgWaiting.toFixed(2)
  document.getElementById("avgTurnaround").textContent = avgTurnaround.toFixed(2)
  document.getElementById("cpuUtilization").textContent = cpuUtil.toFixed(2) + "%"
  document.getElementById("throughput").textContent = throughput.toFixed(2)

  document.getElementById("resultsTable").style.display = "block"
}

function calculateResults(schedule) {
  const results = []
  const uniqueProcesses = [...new Set(schedule.map((s) => s.process))]

  uniqueProcesses.forEach((pid) => {
    const proc = processes.find((p) => p.id === pid)
    const procSchedule = schedule.filter((s) => s.process === pid)
    const completion = Math.max(...procSchedule.map((s) => s.end))
    const turnaround = completion - proc.arrival
    const waiting = turnaround - proc.burst

    results.push({
      process: pid,
      arrival: proc.arrival,
      burst: proc.burst,
      completion,
      turnaround,
      waiting,
    })
  })

  return results.sort((a, b) => a.process.localeCompare(b.process))
}

// Table Sorting
function sortTable(columnIndex) {
  const table = document.getElementById("resultsTableElement")
  const tbody = table.querySelector("tbody")
  const rows = Array.from(tbody.querySelectorAll("tr"))

  if (currentSortColumn === columnIndex) {
    currentSortDirection = currentSortDirection === "asc" ? "desc" : "asc"
  } else {
    currentSortColumn = columnIndex
    currentSortDirection = "asc"
  }

  rows.sort((a, b) => {
    const aValue = a.children[columnIndex].textContent.trim()
    const bValue = b.children[columnIndex].textContent.trim()

    const aNum = Number.parseFloat(aValue)
    const bNum = Number.parseFloat(bValue)

    if (!isNaN(aNum) && !isNaN(bNum)) {
      return currentSortDirection === "asc" ? aNum - bNum : bNum - aNum
    }

    return currentSortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
  })

  rows.forEach((row) => tbody.appendChild(row))

  table.querySelectorAll("th .sort-icon").forEach((icon, index) => {
    if (index === columnIndex) {
      icon.textContent = currentSortDirection === "asc" ? "↑" : "↓"
    } else {
      icon.textContent = "↕"
    }
  })
}
