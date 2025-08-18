// import React, { useState } from 'react';
// import { Input } from '../common/Input';
// import { Button } from '../common/Button';
// import styles from './CommentInput.module.css';
// import clsx from 'clsx';

// export const CommentInput = ({ postId, onAddComment }) => {
//   const [comment, setComment] = useState('');

//   const handleSubmit = () => {
//     if (comment.trim()) {
//       onAddComment(postId, comment);
//       setComment('');
//     }
//   };

//   const handleKeyPress = (e) => {
//     if (e.key === 'Enter') {
//       handleSubmit();
//     }
//   };

//   return (
//     <div className={styles.container}>
//       <div className={styles.inner}>
//         <Input
//           placeholder="댓글 달기..."
//           value={comment}
//           onChange={(e) => setComment(e.target.value)}
//           onKeyPress={handleKeyPress}
//           className={styles.input}
//         />
//         <Button
//           onClick={handleSubmit}
//           disabled={!comment.trim()}
//           variant="ghost"
//           className={clsx(styles.button, {
//             [styles.disabled]: !comment.trim(),
//           })}
//         >
//           게시
//         </Button>
//       </div>
//     </div>
//   );
// };