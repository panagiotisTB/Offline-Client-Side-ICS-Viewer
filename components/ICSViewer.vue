<template>
  <div class="ics-viewer">
    <header class="viewer-header">
      <h1>ICS Calendar Viewer</h1>
      <p class="subtitle">View your calendar events offline - all processing happens in your browser</p>
    </header>

    <div v-if="!parsedData" class="upload-section">
      <div class="upload-container">
        <div class="upload-icon">📅</div>
        <h2>Load Your Calendar</h2>
        <p>Select an .ics file to view its events</p>
        <label class="file-upload-btn">
          <input
            type="file"
            accept=".ics,.ical"
            @change="handleFileUpload"
            ref="fileInput"
          />
          Choose ICS File
        </label>
        <p class="privacy-notice">🔒 Your file never leaves your device</p>
        <a href="/demo.ics" download="demo.ics" class="demo-link">Download Demo ICS File</a>
      </div>
    </div>

    <div v-else class="calendar-view">
      <div class="calendar-header">
        <div class="calendar-info">
          <h2 v-if="parsedData.calendarName">{{ parsedData.calendarName }}</h2>
          <h2 v-else>Calendar Events</h2>
          <p class="event-count">{{ parsedData.events.length }} event{{ parsedData.events.length !== 1 ? 's' : '' }}</p>
        </div>
        <button @click="resetViewer" class="btn-secondary">Load Different File</button>
      </div>

      <div class="filter-section">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search events..."
          class="search-input"
        />
        <select v-model="viewMode" class="view-select">
          <option value="all">All Events</option>
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
        </select>
      </div>

      <div class="events-list">
        <div
          v-for="event in filteredEvents"
          :key="event.uid"
          class="event-card"
          :class="{ 'past-event': isPastEvent(event) }"
        >
          <div class="event-date">
            <div class="day">{{ formatDay(event.start) }}</div>
            <div class="month">{{ formatMonth(event.start) }}</div>
          </div>
          <div class="event-details">
            <h3 class="event-title">{{ event.summary }}</h3>
            <div class="event-meta">
              <span class="meta-item">
                <span class="icon">🕐</span>
                {{ formatEventTime(event) }}
              </span>
              <span v-if="event.location" class="meta-item">
                <span class="icon">📍</span>
                {{ event.location }}
              </span>
              <span v-if="event.status" class="meta-item status" :class="event.status.toLowerCase()">
                {{ event.status }}
              </span>
            </div>
            <p v-if="event.description" class="event-description">
              {{ event.description }}
            </p>
            <div v-if="event.organizer" class="event-organizer">
              <span class="icon">👤</span>
              <span>{{ event.organizer }}</span>
            </div>
            <div v-if="event.attendees && event.attendees.length > 0" class="event-attendees">
              <span class="icon">👥</span>
              <span>{{ event.attendees.length }} attendee{{ event.attendees.length !== 1 ? 's' : '' }}</span>
            </div>
          </div>
        </div>

        <div v-if="filteredEvents.length === 0" class="no-events">
          <p>No events found matching your criteria.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { parseICS, type ParsedICS, type ICSEvent } from '~/utils/icsParser'

const parsedData = ref<ParsedICS | null>(null)
const searchQuery = ref('')
const viewMode = ref<'all' | 'upcoming' | 'past'>('all')
const fileInput = ref<HTMLInputElement | null>(null)

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  try {
    const text = await file.text()
    console.log('File loaded, size:', text.length)
    const result = parseICS(text)
    console.log('Parsed result:', result)
    console.log('Number of events:', result.events.length)
    parsedData.value = result
  } catch (error) {
    console.error('Error parsing ICS file:', error)
    alert('Failed to parse ICS file. Please ensure it\'s a valid calendar file.')
  }
}

const resetViewer = () => {
  parsedData.value = null
  searchQuery.value = ''
  viewMode.value = 'all'
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const isPastEvent = (event: ICSEvent): boolean => {
  return event.end < new Date()
}

const filteredEvents = computed(() => {
  if (!parsedData.value) return []

  let events = parsedData.value.events

  if (viewMode.value === 'upcoming') {
    events = events.filter(e => !isPastEvent(e))
  } else if (viewMode.value === 'past') {
    events = events.filter(e => isPastEvent(e))
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    events = events.filter(e =>
      e.summary.toLowerCase().includes(query) ||
      e.description?.toLowerCase().includes(query) ||
      e.location?.toLowerCase().includes(query)
    )
  }

  return events
})

const formatDay = (date: Date): string => {
  return date.getDate().toString()
}

const formatMonth = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'short' })
}

const formatEventTime = (event: ICSEvent): string => {
  if (event.allDay) {
    if (event.start.toDateString() === event.end.toDateString()) {
      return `All day - ${event.start.toLocaleDateString()}`
    }
    return `${event.start.toLocaleDateString()} - ${event.end.toLocaleDateString()}`
  }

  const startDate = event.start.toLocaleDateString()
  const endDate = event.end.toLocaleDateString()
  const startTime = event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const endTime = event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (startDate === endDate) {
    return `${startDate}, ${startTime} - ${endTime}`
  }

  return `${startDate} ${startTime} - ${endDate} ${endTime}`
}
</script>

<style scoped lang="scss">
.ics-viewer {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 1rem;
}

.viewer-header {
  text-align: center;
  color: white;
  margin-bottom: 3rem;

  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
  }

  .subtitle {
    font-size: 1.1rem;
    opacity: 0.9;
    margin: 0;
  }
}

.upload-section {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
}

.upload-container {
  background: white;
  border-radius: 16px;
  padding: 3rem 2rem;
  text-align: center;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

  .upload-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  h2 {
    font-size: 1.8rem;
    margin: 0 0 0.5rem 0;
    color: #2d3748;
  }

  p {
    color: #718096;
    margin: 0 0 2rem 0;
  }

  .privacy-notice {
    font-size: 0.9rem;
    color: #48bb78;
    margin-top: 1rem;
  }

  .demo-link {
    display: inline-block;
    margin-top: 1rem;
    color: #667eea;
    text-decoration: underline;
    font-size: 0.9rem;
    cursor: pointer;

    &:hover {
      color: #764ba2;
    }
  }
}

.file-upload-btn {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.875rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
  }

  input[type="file"] {
    display: none;
  }
}

.calendar-view {
  max-width: 900px;
  margin: 0 auto;
}

.calendar-header {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  .calendar-info {
    h2 {
      margin: 0 0 0.25rem 0;
      color: #2d3748;
      font-size: 1.75rem;
    }

    .event-count {
      margin: 0;
      color: #718096;
      font-size: 0.95rem;
    }
  }

  .btn-secondary {
    background: #e2e8f0;
    color: #2d3748;
    border: none;
    padding: 0.625rem 1.25rem;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: #cbd5e0;
    }
  }
}

.filter-section {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  gap: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  .search-input,
  .view-select {
    padding: 0.625rem 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 0.95rem;

    &:focus {
      outline: none;
      border-color: #667eea;
    }
  }

  .search-input {
    flex: 1;
  }

  .view-select {
    min-width: 150px;
  }
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.event-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  gap: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }

  &.past-event {
    opacity: 0.7;
  }
}

.event-date {
  flex-shrink: 0;
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;

  .day {
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1;
  }

  .month {
    font-size: 0.875rem;
    text-transform: uppercase;
    margin-top: 0.25rem;
  }
}

.event-details {
  flex: 1;
  min-width: 0;
}

.event-title {
  margin: 0 0 0.75rem 0;
  font-size: 1.25rem;
  color: #2d3748;
  font-weight: 600;
}

.event-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.9rem;
  color: #718096;

  .icon {
    font-size: 1rem;
  }

  &.status {
    padding: 0.25rem 0.625rem;
    border-radius: 4px;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;

    &.confirmed {
      background: #c6f6d5;
      color: #22543d;
    }

    &.tentative {
      background: #feebc8;
      color: #7c2d12;
    }

    &.cancelled {
      background: #fed7d7;
      color: #742a2a;
    }
  }
}

.event-description {
  margin: 0.75rem 0;
  color: #4a5568;
  font-size: 0.95rem;
  line-height: 1.6;
  white-space: pre-wrap;
}

.event-organizer,
.event-attendees {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #718096;

  .icon {
    font-size: 1rem;
  }
}

.no-events {
  background: white;
  border-radius: 12px;
  padding: 3rem;
  text-align: center;
  color: #718096;
}

@media (max-width: 640px) {
  .viewer-header h1 {
    font-size: 1.75rem;
  }

  .calendar-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .filter-section {
    flex-direction: column;
  }

  .event-card {
    flex-direction: column;
  }

  .event-date {
    width: 60px;
    height: 60px;
  }
}
</style>
