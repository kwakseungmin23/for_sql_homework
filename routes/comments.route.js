const express = require('express');
const { Op } = require('sequelize');
const { Comments } = require('../models');
const authMiddleware = require('../middlewares/auth-middleware');
const router = express.Router();

router.get('/comments/:postId', async (req, res) => {
  const { postId } = req.params;
  const comments = await Comments.findAll(
    { where: { PostId: postId } },
    {
      attributes: ['postId', 'commentId', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']],
    }
  );

  return res.status(200).json({ data: comments });
});

router.post('/comments/:postId', authMiddleware, async (req, res) => {
  const { userId } = res.locals.user;
  const { body } = req.body;
  const { postId } = req.params;

  const comment = await Comments.create({
    UserId: userId,
    comment: body,
    PostId: postId,
  });

  return res.status(201).json({ data: comment });
});

router.put('/:postId/:commentId', authMiddleware, async (req, res) => {
  const { commentId, postId } = req.params;
  const { userId } = res.locals.user;
  const { body } = req.body;

  // 게시글을 조회합니다.
  const post = await Comments.findOne({ where: { commentId } });

  if (!post) {
    return res.status(404).json({ message: '커멘트이 존재하지 않습니다.' });
  } else if (post.UserId !== userId) {
    return res.status(401).json({ message: '권한이 없습니다.' });
  }
  // 게시글의 권한을 확인하고, 게시글을 수정합니다.
  let updated = await Comments.update(
    { comment: body },
    {
      where: {
        [Op.and]: [{ commentId }, { UserId: userId }, { PostId: postId }],
      },
    },
    { new: true }
  );
  return res.status(200).send(updated);
});

router.delete('/comments/:commentId', authMiddleware, async (req, res) => {
  const { commentId } = req.params;
  const { userId } = res.locals.user;

  // 게시글을 조회합니다.
  const post = await Comments.findOne({ where: { commentId } });

  if (!post) {
    return res.status(404).json({ message: '커멘트이 존재하지 않습니다.' });
  } else if (post.UserId !== userId) {
    return res.status(401).json({ message: '권한이 없습니다.' });
  }

  // 게시글의 권한을 확인하고, 게시글을 삭제합니다.
  await Comments.destroy({
    where: {
      [Op.and]: [{ commentId }, { UserId: userId }],
    },
  });

  return res.status(200).send(`commentid:${commentId} is being deleted`);
});

module.exports = router;
