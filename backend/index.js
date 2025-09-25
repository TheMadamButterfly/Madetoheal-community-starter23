// Feed (latest public/members posts) with like/comment counts
app.get('/api/feed', auth, async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const q = `
    SELECT 
      p.*,
      u.name AS author_name,
      u.avatar_url AS author_avatar,
      COALESCE(l.likes_count, 0) AS likes_count,
      COALESCE(cm.comments_count, 0) AS comments_count
    FROM posts p
    LEFT JOIN users u ON p.author_id = u.id
    LEFT JOIN (
      SELECT post_id, COUNT(*)::int AS likes_count 
      FROM reactions 
      GROUP BY post_id
    ) l ON l.post_id = p.id
    LEFT JOIN (
      SELECT post_id, COUNT(*)::int AS comments_count
      FROM comments
      GROUP BY post_id
    ) cm ON cm.post_id = p.id
    WHERE p.visibility IN ('public','members')
    ORDER BY p.created_at DESC
    LIMIT $1
  `;
  try {
    const r = await pool.query(q, [limit]);
    res.json(r.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'feed failed' });
  }
});
