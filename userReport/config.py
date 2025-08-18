# config.py
# -*- coding: utf-8 -*-

from datetime import timezone, timedelta

# 시간대 설정
KST = timezone(timedelta(hours=9))

# 색상 팔레트
SEVERITY_COLOR = {"정상": "#2ECC71", "주의": "#F39C12", "경고": "#E74C3C"}

PRIMARY = "#4F46E5"
GREEN   = "#2ECC71"
ORANGE  = "#F39C12"
RED     = "#E74C3C"

# Instagram-ish palette
IG_BLUE   = "#515BD4"
IG_PURPLE = "#8134AF"
IG_PINK   = "#DD2A7B"
IG_ORANGE = "#F58529"

# Lavender for avg temperature line
LAVENDER = "#A78BFA"

# Pastel tones for charts
PASTEL_PINK   = "#F8BBD0"
PASTEL_ORANGE = "#FFE0B2"
PASTEL_PURPLE = "#E9D5FF"

# 분석 관련 상수
POSITIVE_HINTS = ("최고","좋","멋지","훌륭","고마","감사","축하","응원","사랑","대박","굳","기대")
NEUTRAL_SHORT_CHARS = set(".!?,ㅋㅎㅠㅜ~ ")

# 온도 매핑 상수
MIN_TEMP = 36.5
MAX_TEMP = 40.0
TEMP_RANGE = MAX_TEMP - MIN_TEMP

# 기본 임계값
DEFAULT_CAUTION_TEMP = 37.8
DEFAULT_WARN_TEMP = 39.0
BLUR_THRESHOLD = 39.0