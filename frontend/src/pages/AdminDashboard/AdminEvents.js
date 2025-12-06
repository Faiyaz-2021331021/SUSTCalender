import React from 'react';

export default function AdminEvents({ events, onEditEvent }) {
    return (
        <div className="admin-events-container">
            <div className="panel">
                <h4>Recent/Upcoming Events</h4>
                {events.length === 0 ? <p className="no-items">No events yet.</p> : (
                    <ul className="event-list">
                        {events.map(ev => (
                            <li key={ev.id} className="event-card event-card-detailed">
                                <div className="event-details-grid">
                                    <div className="event-field" style={{ marginBottom: 4 }}>
                                        <span className="field-label" style={{ fontSize: '1.1em', color: '#1e293b' }}>{ev.name}</span>
                                    </div>

                                    <div className="event-field">
                                        <span className="field-label">Start:</span>
                                        <span className="field-value">
                                            {ev.startDate || ev.date} {ev.startTime ? `@ ${ev.startTime}` : ""}
                                        </span>
                                    </div>

                                    {(ev.endDate || ev.endTime) && (
                                        <div className="event-field">
                                            <span className="field-label">End:</span>
                                            <span className="field-value">
                                                {ev.endDate || ev.startDate || ev.date} {ev.endTime ? `@ ${ev.endTime}` : ""}
                                            </span>
                                        </div>
                                    )}

                                    <div className="event-field">
                                        <span className="field-label">Audience:</span>
                                        <span className="field-value capitalize">{ev.targetAudience}</span>
                                    </div>
                                </div>
                                <div className="event-actions">
                                    <button
                                        className="btn btn-secondary btn-small"
                                        onClick={() => onEditEvent(ev)}
                                    >
                                        Manage
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
