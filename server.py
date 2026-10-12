"""Local development server for the AV's ICSE Arena app.

Serves the static frontend (index.html, generator.js, etc.) from the current
working directory, and accepts activity POSTs at /save (quiz completions and
stashed idea cards from index.html), appending each one as a JSON line to
scores_dashboard.json.
"""

import datetime
import json
import os
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

SCORES_FILE = "scores_dashboard.json"
HOST = "0.0.0.0"
PORT = 8000

# The plain http.server.HTTPServer handles one request at a time on a single
# thread — if any one connection stalls or lingers (a slow client, a device
# that dropped off-network mid-request), every other device trying to reach
# the app blocks behind it indefinitely. ThreadingHTTPServer handles each
# connection on its own thread so one stuck client can't freeze the app for
# everyone else. Writes to SCORES_FILE now happen from multiple threads, so
# they're serialized through this lock to avoid interleaved/corrupted lines.
_scores_file_lock = threading.Lock()

# A freeze token forgives exactly one missed day in an otherwise-consecutive
# streak (so a single busy day doesn't wipe out weeks of progress). One token
# is earned per 7 distinct active days, banked up to this cap.
FREEZE_TOKEN_EVERY_N_DAYS = 7
MAX_FREEZE_TOKENS = 3

# Spaced repetition: a lesson becomes eligible for "Memory Boost" once at least
# this many days have passed since it was last practiced. There's no upper
# bound — the longer it's been, the more overdue (and higher-priority) it is.
MEMORY_BOOST_MIN_DAYS = 14
MEMORY_BOOST_MAX_CANDIDATES = 5


def _read_log_entries():
    if not os.path.exists(SCORES_FILE):
        return []
    entries = []
    with open(SCORES_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entries.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return entries


def _parse_date(iso_timestamp):
    try:
        return datetime.datetime.fromisoformat(str(iso_timestamp).replace("Z", "+00:00")).date()
    except (ValueError, AttributeError, TypeError):
        return None


def _tokens_earned(active_day_count):
    return min(active_day_count // FREEZE_TOKEN_EVERY_N_DAYS, MAX_FREEZE_TOKENS)


def _compute_streak(active_dates):
    """active_dates: sorted, deduped list of date objects with any activity.

    Walks the active days in order, tracking the current consecutive run and
    "spending" an earned freeze token whenever exactly one day is skipped (a
    2-day gap). A gap of 2+ days with no token available, or any gap larger
    than 2, breaks the streak. Finally checks whether the run is still alive
    as of today using the same rule.
    """
    if not active_dates:
        return 0, 0, 0

    tokens_used = 0
    run = 1
    longest = 1

    for i in range(1, len(active_dates)):
        gap = (active_dates[i] - active_dates[i - 1]).days
        tokens_available = _tokens_earned(i + 1) - tokens_used

        if gap == 1:
            run += 1
        elif gap == 2 and tokens_available > 0:
            run += 1
            tokens_used += 1
        else:
            run = 1

        longest = max(longest, run)

    gap_to_today = (datetime.date.today() - active_dates[-1]).days
    tokens_available = _tokens_earned(len(active_dates)) - tokens_used

    if gap_to_today <= 1:
        current = run
    elif gap_to_today == 2 and tokens_available > 0:
        current = run
        tokens_used += 1
    else:
        current = 0

    freeze_tokens_available = max(0, _tokens_earned(len(active_dates)) - tokens_used)
    return current, longest, freeze_tokens_available


def compute_progress(name):
    """Builds a per-student progress summary purely from the local activity
    log this server already writes (scores_dashboard.json) — no external
    calls, no separate state file to keep in sync."""
    entries = _read_log_entries()
    name_lower = (name or "").strip().lower()
    mine = [e for e in entries if str(e.get("name", "")).strip().lower() == name_lower]

    active_dates = sorted({d for d in (_parse_date(e.get("timestamp")) for e in mine) if d})
    current_streak, longest_streak, freeze_tokens = _compute_streak(active_dates)

    last_quiz = None
    for e in reversed(mine):
        if e.get("action") == "quiz_completed" and isinstance(e.get("payload"), dict):
            last_quiz = e["payload"]
            break

    return {
        "name": name,
        "currentStreak": current_streak,
        "longestStreak": longest_streak,
        "freezeTokensAvailable": freeze_tokens,
        "activeDaysTotal": len(active_dates),
        "lastQuiz": last_quiz,
    }


def compute_memory_boost(name):
    """Finds lessons this student hasn't practiced in a while, using only the
    subjectKey/lessonKey fields already present on quiz_completed log entries
    (older entries that predate those fields are simply skipped — they can't
    be matched back to a specific lesson to relaunch a quiz for)."""
    entries = _read_log_entries()
    name_lower = (name or "").strip().lower()
    mine = [e for e in entries if str(e.get("name", "")).strip().lower() == name_lower]

    latest_by_lesson = {}
    for e in mine:
        if e.get("action") != "quiz_completed":
            continue
        payload = e.get("payload")
        if not isinstance(payload, dict):
            continue
        subject_key = payload.get("subjectKey")
        lesson_key = payload.get("lessonKey")
        if not subject_key or not lesson_key:
            continue
        d = _parse_date(e.get("timestamp"))
        if not d:
            continue
        key = (subject_key, lesson_key)
        existing = latest_by_lesson.get(key)
        if not existing or d > existing["date"]:
            latest_by_lesson[key] = {
                "date": d,
                "subject": payload.get("subject") or subject_key,
                "lesson": payload.get("lesson") or lesson_key,
            }

    today = datetime.date.today()
    candidates = [
        {
            "subjectKey": subject_key,
            "lessonKey": lesson_key,
            "subject": info["subject"],
            "lesson": info["lesson"],
            "daysSinceLastPractice": (today - info["date"]).days,
        }
        for (subject_key, lesson_key), info in latest_by_lesson.items()
        if (today - info["date"]).days >= MEMORY_BOOST_MIN_DAYS
    ]
    candidates.sort(key=lambda c: c["daysSinceLastPractice"], reverse=True)

    return {"name": name, "candidates": candidates[:MEMORY_BOOST_MAX_CANDIDATES]}


class RequestHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)

        if parsed.path == "/progress":
            name = parse_qs(parsed.query).get("name", [""])[0]
            if not name:
                self._send_json(400, {"status": "error", "message": "Missing 'name' query parameter"})
                return
            self._send_json(200, compute_progress(name))
            return

        if parsed.path == "/memory-boost":
            name = parse_qs(parsed.query).get("name", [""])[0]
            if not name:
                self._send_json(400, {"status": "error", "message": "Missing 'name' query parameter"})
                return
            self._send_json(200, compute_memory_boost(name))
            return

        # If the dashboard requests the scores file and it doesn't exist yet, return an empty file response
        if parsed.path == f"/{SCORES_FILE}":
            if not os.path.exists(SCORES_FILE):
                self._send_json(200, "")
                return
        super().do_GET()

    def do_POST(self):
        if self.path != "/save":
            self.send_error(404, "Not Found")
            return

        # Reject cross-origin writes. Browsers allow simple (non-preflighted) POSTs
        # to succeed even without any CORS headers on the response, so a malicious
        # page open in another tab could otherwise still get a write through. Only
        # requests whose declared Origin matches this server are accepted; requests
        # with no Origin header (same-origin fetches from this app, and non-browser
        # tools) are still allowed.
        origin = self.headers.get("Origin")
        if origin and origin not in (f"http://{self.headers.get('Host', '')}", f"https://{self.headers.get('Host', '')}"):
            self._send_json(403, {"status": "error", "message": "Cross-origin requests are not allowed"})
            return

        content_length = int(self.headers.get("Content-Length", 0))
        raw_body = self.rfile.read(content_length) if content_length > 0 else b""

        try:
            data = json.loads(raw_body.decode("utf-8")) if raw_body else {}
        except (json.JSONDecodeError, UnicodeDecodeError):
            self._send_json(400, {"status": "error", "message": "Invalid JSON body"})
            return

        # Append each incoming record as a new line in the JSON log file
        with _scores_file_lock:
            with open(SCORES_FILE, "a", encoding="utf-8") as f:
                f.write(json.dumps(data) + "\n")

        self._send_json(200, {"status": "ok"})

    def _send_json(self, status_code, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


class _Server(ThreadingHTTPServer):
    # Default backlog (5) is easily exceeded by a burst of near-simultaneous
    # connections (multiple devices, or a browser's several parallel asset
    # requests) — connections beyond the backlog get refused outright rather
    # than queued, which looks identical to the server being down.
    request_queue_size = 128


def main():
    httpd = _Server((HOST, PORT), RequestHandler)
    httpd.daemon_threads = True
    print(f"Serving AV's ICSE Arena on http://{HOST}:{PORT} ...")
    print(f"Activity POSTs to /save are appended to '{SCORES_FILE}'.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        httpd.server_close()


if __name__ == "__main__":
    main()