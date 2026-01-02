export const TARGET_OPTIONS = {
  DEMO: {
    label: "인구통계",
    fields: [
      {
        key: "gender",
        label: "성별",
        type: "radio",
        options: [
          { label: "전체", value: "ALL" },
          { label: "남성", value: "M" },
          { label: "여성", value: "F" }
        ]
      },
      {
        key: "age_10s",
        label: "연령대",
        type: "checkbox",
        options: [
          { label: "10대", value: "AGE_10S" },
          { label: "20대", value: "AGE_20S" },
          { label: "30대", value: "AGE_30S" },
          { label: "40대", value: "AGE_40S" },
          { label: "50대", value: "AGE_50S" },
          { label: "60대 이상", value: "AGE_60S_PLUS" }
        ]
      },
      {
        key: "household_type",
        label: "가구 유형",
        type: "checkbox",
        options: [
          { label: "1인 가구", value: "HH_SINGLE" },
          { label: "2인 가구(무자녀)", value: "HH_COUPLE" },
          { label: "자녀 있는 가구", value: "HH_WITH_KIDS" },
          { label: "3세대 이상 동거", value: "HH_MULTI_GEN" }
        ]
      },
      {
        key: "kids_stage",
        label: "자녀 연령대",
        type: "checkbox",
        options: [
          { label: "자녀 없음", value: "NO_KIDS" },
          { label: "영유아(0-6세)", value: "KIDS_0_6" },
          { label: "초등", value: "KIDS_7_12" },
          { label: "중·고등", value: "KIDS_13_18" },
          { label: "성인 자녀", value: "KIDS_19_PLUS" }
        ]
      }
    ]
  },
  SPENDING: {
    label: "소득/소비여력",
    fields: [
      {
        key: "spending_power",
        label: "소득/소비 여력",
        type: "radio",
        options: [
          { label: "저소비층", value: "LOW" },
          { label: "중간", value: "MID" },
          { label: "고소비층", value: "HIGH" },
          { label: "프리미엄/명품", value: "PREMIUM" }
        ]
      }
    ]
  },
  OCCUPATION: {
    label: "직업",
    fields: [
      {
        key: "occupation_type",
        label: "직업",
        type: "checkbox",
        options: [
          { label: "학생", value: "STUDENT" },
          { label: "직장인", value: "OFFICE_WORKER" },
          { label: "자영업", value: "SELF_EMPLOYED" },
          { label: "전업주부", value: "HOMEMAKER" },
          { label: "프리랜서", value: "FREELANCER" },
          { label: "기타", value: "OTHER" }
        ]
      }
    ]
  },
  INTEREST: {
    label: "관심사",
    fields: [
      {
        key: "interest_category",
        label: "관심사 카테고리",
        type: "checkbox",
        options: [
          { label: "식품·생필품", value: "INT_FOOD_GROCERY" },
          { label: "외식·배달", value: "INT_DINING_DELIVERY" },
          { label: "패션·뷰티", value: "INT_FASHION_BEAUTY" },
          { label: "명품·수입", value: "INT_LUXURY" },
          { label: "리빙·인테리어", value: "INT_HOME_LIVING" },
          { label: "IT·디지털", value: "INT_DIGITAL_IT" },
          { label: "게임", value: "INT_GAME" },
          { label: "스포츠·아웃도어", value: "INT_SPORTS_OUTDOOR" },
          { label: "여행", value: "INT_TRAVEL" },
          { label: "자동차", value: "INT_AUTO_MOBILITY" },
          { label: "재테크·금융", value: "INT_FINANCE" },
          { label: "육아·키즈", value: "INT_FAMILY_KIDS" },
          { label: "반려동물", value: "INT_PET" },
          { label: "건강·웰니스", value: "INT_HEALTH_WELLNESS" },
          { label: "교육", value: "INT_EDU" },
          { label: "엔터테인먼트", value: "INT_ENTERTAIN" },
          { label: "환경·사회이슈", value: "INT_ENV_SOCIAL" }
        ]
      }
    ]
  },
  BEHAVIOR: {
    label: "쇼핑/행동",
    fields: [
      {
        key: "shopping_category",
        label: "쇼핑 카테고리",
        type: "radio",
        options: [
          { label: "식품·생필품", value: "SHOP_FOOD_GROCERY" },
          { label: "외식", value: "SHOP_DINING" },
          { label: "의류·패션", value: "SHOP_FASHION" },
          { label: "뷰티", value: "SHOP_BEAUTY" },
          { label: "가전", value: "SHOP_ELECTRONICS" },
          { label: "리빙", value: "SHOP_HOME_LIVING" },
          { label: "게임 아이템", value: "SHOP_GAME_ITEM" },
          { label: "자동차", value: "SHOP_AUTO" },
          { label: "여행", value: "SHOP_TRAVEL" },
          { label: "금융", value: "SHOP_FINANCE" },
          { label: "육아", value: "SHOP_KIDS_BABY" },
          { label: "반려동물", value: "SHOP_PET" },
          { label: "기타", value: "SHOP_ETC" }
        ]
      }
    ]
  },
  APP_USAGE: {
    label: "앱/서비스 이용",
    fields: [
      {
        key: "app_category",
        label: "앱 카테고리",
        type: "radio",
        options: [
          { label: "커머스/쇼핑", value: "APP_COMMERCE" },
          { label: "배달", value: "APP_DELIVERY" },
          { label: "모빌리티", value: "APP_MOBILITY" },
          { label: "금융", value: "APP_FINANCE" },
          { label: "간편결제", value: "APP_SIMPLEPAY" },
          { label: "멤버십", value: "APP_LOYALTY" },
          { label: "게임", value: "APP_GAME" },
          { label: "OTT/영상", value: "APP_OTT_VIDEO" },
          { label: "음악", value: "APP_MUSIC" },
          { label: "교육", value: "APP_EDU" },
          { label: "커뮤니티", value: "APP_COMMUNITY" },
          { label: "SNS", value: "APP_SNS" },
          { label: "유틸리티", value: "APP_UTIL" }
        ]
      }
    ]
  },
  CUSTOM_APP: {
    label: "커스텀 앱 타겟",
    fields: [
      {
        key: "custom_app_text",
        label: "커스텀 앱 타겟",
        type: "text",
        placeholder: "예: 00앱을 설치한 유저 (앱 이름 입력) 2개 이상일 경우 쉼표로 입력"
      }
    ]
  },
  LOCATION: {
    label: "위치/생활권",
    fields: [
      {
        key: "residence_region",
        label: "거주 지역",
        type: "checkbox",
        options: [
          { label: "서울", value: "SEOUL" },
          { label: "경기", value: "GYEONGGI" },
          { label: "인천", value: "INCHEON" },
          { label: "부산", value: "BUSAN" },
          { label: "대구", value: "DAEGU" },
          { label: "광주", value: "GWANGJU" },
          { label: "대전", value: "DAEJEON" },
          { label: "울산", value: "ULSAN" },
          { label: "세종", value: "SEJONG" },
          { label: "강원", value: "GANGWON" },
          { label: "충북", value: "CHUNGBUK" },
          { label: "충남", value: "CHUNGNAM" },
          { label: "전북", value: "JEONBUK" },
          { label: "전남", value: "JEONNAM" },
          { label: "경북", value: "GYEONGBUK" },
          { label: "경남", value: "GYEONGNAM" },
          { label: "제주", value: "JEJU" }
        ]
      }
    ]
  },
  CUSTOM_LOCATION: {
    label: "커스텀 위치 타겟",
    fields: [
      {
        key: "custom_location_text",
        label: "커스텀 위치 타겟",
        type: "text",
        placeholder: "예: 네비게이션에 ㅇㅇ검색을 한 사람 (지도 검색어 입력) 2개 이상일 경우 쉼표로 입력"
      }
    ]
  },
  MEMBERSHIP: {
    label: "멤버십",
    fields: [
      {
        key: "membership_type",
        label: "멤버십 유형",
        type: "checkbox",
        options: [
          { label: "유통/편의점", value: "MB_RETAIL" },
          { label: "주유", value: "MB_FUEL" },
          { label: "통신사", value: "MB_TELCO" },
          { label: "여행/항공", value: "MB_TRAVEL" },
          { label: "문화", value: "MB_CULTURE" },
          { label: "통합포인트", value: "MB_PT_LOYALTY" }
        ]
      }
    ]
  },
  PAYMENT: {
    label: "결제",
    fields: [
      {
        key: "payment_type",
        label: "주 결제 수단",
        type: "checkbox",
        options: [
          { label: "신용카드", value: "PAY_CREDIT_CARD_MAIN" },
          { label: "체크카드", value: "PAY_CHECK_CARD_MAIN" },
          { label: "간편결제", value: "PAY_SIMPLEPAY_MAIN" },
          { label: "현금/계좌", value: "PAY_CASH_ACCOUNT" },
          { label: "소액결제", value: "PAY_MICRO" }
        ]
      }
    ]
  },
  CONTENT: {
    label: "콘텐츠",
    fields: [
      {
        key: "content_category",
        label: "관심 콘텐츠",
        type: "checkbox",
        options: [
          { label: "뉴스/정치", value: "CONT_NEWS_POLITICS" },
          { label: "경제/금융", value: "CONT_ECON_FINANCE" },
          { label: "스포츠", value: "CONT_SPORTS" },
          { label: "예능", value: "CONT_ENTERTAIN" },
          { label: "드라마/영화", value: "CONT_DRAMA_MOVIE" },
          { label: "자동차", value: "CONT_AUTO" },
          { label: "부동산", value: "CONT_REAL_ESTATE" },
          { label: "IT/디지털", value: "CONT_IT_DIGITAL" },
          { label: "푸드/라이프", value: "CONT_LIFE_FOOD" },
          { label: "홈쇼핑", value: "CONT_HOME_SHOPPING" },
          { label: "키즈/교육", value: "CONT_KIDS" }
        ]
      }
    ]
  },
  MARRIAGE: {
    label: "결혼/가구",
    fields: [
      {
        key: "marital_stage",
        label: "결혼/가구",
        type: "radio",
        options: [
          { label: "미혼/싱글", value: "SINGLE" },
          { label: "동거/커플", value: "COUPLE_NO_MARRIAGE" },
          { label: "기혼(무자녀)", value: "MARRIED_NO_KIDS" },
          { label: "기혼(유자녀)", value: "MARRIED_WITH_KIDS" },
          { label: "결혼예정", value: "TO_BE_MARRIED" }
        ]
      }
    ]
  },
  LIFECYCLE: {
    label: "생애주기",
    fields: [
      {
        key: "life_stage",
        label: "생애 주기",
        type: "radio",
        options: [
          { label: "사회초년생", value: "LST_EARLY_20S" },
          { label: "커리어/신혼", value: "LST_LATE_20S_30S" },
          { label: "육아기", value: "LST_CHILD_REARING" },
          { label: "자녀성장기", value: "LST_MID_LIFE" },
          { label: "자녀독립", value: "LST_EMPTY_NEST" },
          { label: "시니어", value: "LST_SENIOR" }
        ]
      }
    ]
  }
};