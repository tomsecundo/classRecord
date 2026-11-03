"""Exercise the actual route SQL against SQLite with transactional writes."""
from pathlib import Path
import re, sqlite3
root=Path(__file__).resolve().parents[1]
source=(root/'app/api/workspace/route.ts').read_text()
sql=re.findall(r"(?:prepare)\('([^']+)'\)",source)
read,create,delete,insert,update=sql
conn=sqlite3.connect(':memory:')
conn.executescript((root/'drizzle/0001_peaceful_madame_masque.sql').read_text())
def save(uid,revision,chunks):
 with conn:
  conn.execute(create,(uid,))
  conn.execute(delete,(uid,uid,revision))
  for i,chunk in enumerate(chunks): conn.execute(insert,(uid,i,chunk,uid,revision))
  return conn.execute(update,(uid,revision)).rowcount
assert save('teacher',0,['original',' record'])==1
assert save('teacher:school-simulation',0,['demo'])==1
assert save('teacher',0,['stale overwrite'])==0
assert ''.join(r[2] for r in conn.execute(read,('teacher',)))=='original record'
assert save('teacher',1,['new'])==1
assert list(conn.execute(read,('teacher',)))==[(2,0,'new')]
assert list(conn.execute(read,('teacher:school-simulation',)))==[(1,0,'demo')]
try:
 with conn:
  conn.execute(delete,('teacher','teacher',2))
  conn.execute(insert,('teacher',0,'partial','teacher',2))
  conn.execute(insert,('teacher',0,'duplicate','teacher',2))
except sqlite3.IntegrityError: pass
assert list(conn.execute(read,('teacher',)))==[(2,0,'new')]
print('Passed: stale-save rejection, simulation isolation, shrinking snapshots, atomic rollback.')
