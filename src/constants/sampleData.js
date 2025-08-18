// sampleData
export const SAMPLE_USERS = [
  {
    id: 1,
    username: 'mamstouch',
    profileImage:
      '/img/우유.jpg'
  },
  {
    id: 2,
    username: 'blackpinkofficial',
    profileImage:
      '/img/blackpink.jpg',
  },
  {
    id: 3,
    username: 'kwon071013',
    profileImage:
      '/img/영재오.jpg',
  },
];

export const SAMPLE_POSTS = [
  {
    id: 1,
    user: SAMPLE_USERS[0],
    image:
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=500&fit=crop',
    caption: '와 이거 이사람 선넘...',
    likes: 1054,
    comments: [
      {
        user: 'user1',
        text: '와 정말 아름답네요!',
        profileImage:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
      },
      {
        user: 'user2',
        text: '어디서 찍은 사진인가요?',
        profileImage:
          'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop&crop=face',
      },
    ],
    isLiked: false,
    timeAgo: '2시간 전',
  },
  {
    id: 2,
    user: SAMPLE_USERS[1],
    image:
      'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500&h=500&fit=crop',
    caption: '오늘의 브런치 🥐☕ 완벽한 하루의 시작!',
    likes: 89,
    comments: [
      {
        user: 'user3',
        text: '맛있어 보여요!',
        profileImage:
          'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      },
    ],
    isLiked: true,
    timeAgo: '4시간 전',
  },
  {
    id: 3,
    user: SAMPLE_USERS[2],
    image:
      'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=500&h=500&fit=crop',
    caption: '산 정상에서 바라본 풍경 🏔️ #등산 #자연',
    likes: 234,
    comments: [
      {
        user: 'hiker_pro',
        text: '어느 산인가요?',
        profileImage:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      },
      {
        user: 'mountain_lover',
        text: '정말 멋진 뷰네요!',
        profileImage:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
      },
    ],
    isLiked: false,
    timeAgo: '6시간 전',
  },
];

export const SAMPLE_MESSAGES = [
  {
    id: 1,
    user: SAMPLE_USERS[0],
    lastMessage: '안녕하세요! 사진 정말 멋져요',
    time: '방금 전',
    unread: true,
    conversation: [
      { sender: 'nature_lover', message: '안녕하세요!', time: '오후 2:30' },
      {
        sender: 'nature_lover',
        message: '사진 정말 멋져요',
        time: '오후 2:31',
      },
    ],
  },
  {
    id: 2,
    user: SAMPLE_USERS[1],
    lastMessage: '맛있는 곳 추천해주세요!',
    time: '1시간 전',
    unread: false,
    conversation: [
      {
        sender: 'food_explorer',
        message: '맛있는 곳 추천해주세요!',
        time: '오후 1:30',
      },
    ],
  },
];
