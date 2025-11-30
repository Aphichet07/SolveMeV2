// controllers/review.controller.js
import reviewService from "../services/review.service.js";

const reviewController = {
  /**
   * POST /api/review/submit
   *
   * body:
   *  - match_id      (string, required)
   *  - bubble_id     (string, optional)
   *  - from_user_id  (string, required)
   *  - to_user_id    (string, required)
   *  - score         (number, 1–5, required)
   *  - comment       (string, optional)
   */
  async submit(req, res) {
    try {
      const {
        match_id,
        bubble_id,
        from_user_id,
        to_user_id,
        score,
        comment,
      } = req.body || {};

      if (!match_id || !from_user_id || !to_user_id || score == null) {
        return res.status(400).json({
          message: "match_id, from_user_id, to_user_id, score is required",
        });
      }

      await reviewService.submitReview({
        matchId: match_id,
        bubbleId: bubble_id,
        fromUserId: from_user_id,
        toUserId: to_user_id,
        score,
        comment,
      });

      return res.json({ ok: true });
    } catch (err) {
      console.error("[reviewController] submit error:", err);
      return res.status(500).json({
        ok: false,
        message: err.message || "submit review failed",
      });
    }
  },
};

export default reviewController;
