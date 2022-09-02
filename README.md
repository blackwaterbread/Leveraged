# Leveraged

![7](https://user-images.githubusercontent.com/40688555/187996897-3b875758-52d2-477a-9fee-ccec42900661.png)

> Binance 거래소에서 거래하는 트레이더를 위해서 수수료, 강제 청산가를 간단하게 예상해 주는 App 입니다.

## 사용하시기 전에

* 예상치와 실제 매매 시 수치와는 다소 다를 수 있어요.

* 잡알트들은 소수점 처리를 얼렁뚱땅 넘어간 부분이 있어서 좀 불편할지도 몰라요. (개선 예정)

* 아직 교차 마진 모드에서의 예상 청산가는 지원하지 않아요.

## 설치 및 실행 방법

### 1. [Github Release]() 에서 최신 버전을 다운로드 하여 App을 설치합니다.

### 2. [Binance](https://binance.com) API를 발급 받아야 합니다. [Binance](https://binance.com)로 이동하여 로그인 합니다.

### 3. [Binance API Management](https://www.binance.com/en/my/settings/api-management) 페이지로 이동합니다.

### 4. 상단의 'Create API' 버튼 클릭
![1](https://user-images.githubusercontent.com/40688555/188056705-59dc9431-d305-4fba-abc8-2e2ad640b453.png)

### 5. 이름을 정하는 창이 뜨는데 그냥 적당히 정하시면 됩니다.

![2](https://user-images.githubusercontent.com/40688555/187994877-9a9bae03-9a97-4951-8996-052bb44e050d.png)

### 6. 본인확인 절차 거치는데 평소 하던대로 진행하시면 됩니다.

![3](https://user-images.githubusercontent.com/40688555/187994878-1f06a71c-27e1-41a3-9e8b-083389d107ff.png)

![4](https://user-images.githubusercontent.com/40688555/187994880-84937357-909b-4771-ab90-40251c61d3c5.png)

### 7. 본인확인 절차가 끝나면 바로 API 발급이 됩니다.

### 8. 여기서 아무것도 건들지 마시고, API Key와 Secret Key만 복사해 두시면 됩니다.

### ※ API Key, Secret Key는 절대 타인에게 노출되어서는 안됩니다

### ※ API Restrictions는 'Enable Reading' 권한만 체크되어 있어야 합니다.

![5](https://user-images.githubusercontent.com/40688555/188056707-d0bbfa6c-916d-4778-a13e-e5c08853a7e1.png)

### 8. Leveraged App을 실행합니다.

### 9. 복사해놨던 API Key, Secret Key를 붙여넣고 '확인' 버튼을 누릅니다.

![6](https://user-images.githubusercontent.com/40688555/187996890-3f8b540e-6d83-4256-bed7-8c516f130f9b.png)

### 9. 잠시 로딩 후에 앱이 실행됩니다.

![7](https://user-images.githubusercontent.com/40688555/187996897-3b875758-52d2-477a-9fee-ccec42900661.png)

## FAQ

#### 이거 하면 계좌 해킹당하는거아님?

API 권한이 Reading 밖에 없어서 하려해도 못해요 그리고 앱이 관리자권한을 요구하지 않습니다 .. ㅠ

#### 연결이 안된다는데요?

API Key, Secret 다시 한번 확인해보시고 안되면 이슈 탭에 문의해주시거나 댓글로 물어봐주세요

#### 반대 포지션 청산가는 어케보나요?

예상 청산가를 한번 눌러주시면 바뀝니다.

#### 실제랑 수치가 좀 다른데요?

약간 다를수도 있어요

#### 왜 교차는 청산가 계산이 안되나요?

![8](https://user-images.githubusercontent.com/40688555/188057367-ad77855f-4115-4293-a10d-1585be9aaf3a.png)

식이 좀 복잡해서 다음에 지원할께요 ...

#### 왤케 용량이 큼?

기반 기술 탓이긴한데 좀 줄여볼게요