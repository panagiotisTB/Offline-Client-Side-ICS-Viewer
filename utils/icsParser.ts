export interface ICSEvent {
  uid: string
  summary: string
  description?: string
  location?: string
  start: Date
  end: Date
  allDay: boolean
  status?: string
  organizer?: string
  attendees?: string[]
}

export interface ParsedICS {
  events: ICSEvent[]
  calendarName?: string
  timezone?: string
}

function parseDate(dateString: string, timezone?: string): Date {
  const cleanDate = dateString.replace(/TZID=[^:]+:/, '')

  if (cleanDate.length === 8) {
    const year = parseInt(cleanDate.substring(0, 4))
    const month = parseInt(cleanDate.substring(4, 6)) - 1
    const day = parseInt(cleanDate.substring(6, 8))
    return new Date(year, month, day)
  }

  const year = parseInt(cleanDate.substring(0, 4))
  const month = parseInt(cleanDate.substring(4, 6)) - 1
  const day = parseInt(cleanDate.substring(6, 8))
  const hour = parseInt(cleanDate.substring(9, 11))
  const minute = parseInt(cleanDate.substring(11, 13))
  const second = parseInt(cleanDate.substring(13, 15))

  if (cleanDate.endsWith('Z')) {
    return new Date(Date.UTC(year, month, day, hour, minute, second))
  }

  return new Date(year, month, day, hour, minute, second)
}

function unfoldLines(content: string): string[] {
  const lines = content.split(/\r?\n/)
  const unfolded: string[] = []

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]

    while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
      line += lines[i + 1].substring(1)
      i++
    }

    if (line.trim()) {
      unfolded.push(line)
    }
  }

  return unfolded
}

function parsePropertyValue(line: string): { key: string; value: string; params: Record<string, string> } {
  const colonIndex = line.indexOf(':')
  if (colonIndex === -1) {
    return { key: '', value: line, params: {} }
  }

  const beforeColon = line.substring(0, colonIndex)
  const value = line.substring(colonIndex + 1)

  const semicolonIndex = beforeColon.indexOf(';')
  let key: string
  let params: Record<string, string> = {}

  if (semicolonIndex === -1) {
    key = beforeColon
  } else {
    key = beforeColon.substring(0, semicolonIndex)
    const paramString = beforeColon.substring(semicolonIndex + 1)
    const paramPairs = paramString.split(';')

    paramPairs.forEach(pair => {
      const [paramKey, paramValue] = pair.split('=')
      if (paramKey && paramValue) {
        params[paramKey.trim()] = paramValue.trim().replace(/^"(.*)"$/, '$1')
      }
    })
  }

  return { key: key.trim(), value: value.trim(), params }
}

export function parseICS(content: string): ParsedICS {
  const lines = unfoldLines(content)
  console.log('Total lines after unfolding:', lines.length)
  const events: ICSEvent[] = []
  let calendarName: string | undefined
  let timezone: string | undefined

  let currentEvent: Partial<ICSEvent> | null = null
  let inEvent = false

  for (const line of lines) {
    const { key, value, params } = parsePropertyValue(line)

    if (key === 'BEGIN' && value === 'VEVENT') {
      console.log('Found VEVENT start')
      inEvent = true
      currentEvent = {
        uid: '',
        summary: '',
        start: new Date(),
        end: new Date(),
        allDay: false,
        attendees: []
      }
    } else if (key === 'END' && value === 'VEVENT') {
      if (currentEvent && currentEvent.uid) {
        console.log('Pushing event:', currentEvent)
        events.push(currentEvent as ICSEvent)
      } else {
        console.warn('Event missing UID, not added:', currentEvent)
      }
      currentEvent = null
      inEvent = false
    } else if (inEvent && currentEvent) {
      switch (key) {
        case 'UID':
          currentEvent.uid = value
          break
        case 'SUMMARY':
          currentEvent.summary = value
          break
        case 'DESCRIPTION':
          currentEvent.description = value.replace(/\\n/g, '\n').replace(/\\,/g, ',')
          break
        case 'LOCATION':
          currentEvent.location = value.replace(/\\,/g, ',')
          break
        case 'DTSTART':
          currentEvent.start = parseDate(value, params.TZID)
          currentEvent.allDay = value.length === 8
          break
        case 'DTEND':
          currentEvent.end = parseDate(value, params.TZID)
          break
        case 'STATUS':
          currentEvent.status = value
          break
        case 'ORGANIZER':
          currentEvent.organizer = value.replace(/^mailto:/i, '')
          break
        case 'ATTENDEE':
          if (!currentEvent.attendees) currentEvent.attendees = []
          currentEvent.attendees.push(value.replace(/^mailto:/i, ''))
          break
      }
    } else if (!inEvent) {
      if (key === 'X-WR-CALNAME') {
        calendarName = value
      } else if (key === 'X-WR-TIMEZONE') {
        timezone = value
      }
    }
  }

  console.log('Total events parsed:', events.length)
  events.sort((a, b) => a.start.getTime() - b.start.getTime())

  return {
    events,
    calendarName,
    timezone
  }
}
