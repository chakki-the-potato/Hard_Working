---
title: "Roboflow Safety Helmet ONNX 모델이란? 안전모 감지의 개념과 활용"
description: "Roboflow가 제공하는 Safety Helmet 탐지 ONNX 모델의 구조와 동작 원리, 그리고 실제 현장에서 추론까지 어떻게 이어지는지 설명합니다."
pubDate: 2026-05-04T22:28:32+09:00
category: programming
tags: ["AI"]
version: "v1.0"
---

"안전모 착용 여부를 카메라로 자동 감지하고 싶다"는 요구는 건설 현장, 제조 공장 가릴 것 없이 꽤 흔하게 등장합니다. 직접 모델을 학습시키려면 데이터 수집부터 라벨링, 학습, 최적화까지 몇 달이 걸릴 수도 있는데, Roboflow가 이 흐름을 상당히 단축시켜 줍니다. 그 중심에 있는 게 바로 ONNX 포맷으로 내보낸 Safety Helmet 탐지 모델입니다.

## Roboflow의 Safety Helmet 모델이란?

Roboflow Universe는 커뮤니티가 공유하는 수천 개의 컴퓨터 비전 데이터셋과 사전 학습 모델 허브입니다. Safety Helmet 탐지 모델은 그 중에서도 가장 많이 사용되는 산업 안전 관련 모델 중 하나로, 헬멧을 착용한 사람(`helmet`)과 착용하지 않은 사람(`no-helmet`)을 실시간으로 구분하도록 학습되어 있습니다.

기반 아키텍처는 주로 YOLOv8(또는 YOLOv5)입니다. 바운딩 박스 + 클래스 레이블 형태의 객체 탐지 모델이라 단순히 "있냐 없냐"가 아니라 화면에서 어디에 누가 헬멧을 쓰지 않았는지를 좌표로 특정할 수 있습니다.

## ONNX 포맷이 왜 등장하나?

ONNX(Open Neural Network eXchange)는 PyTorch, TensorFlow 등 서로 다른 프레임워크 간에 모델을 호환 가능하도록 만들기 위한 개방형 포맷입니다. Roboflow에서 모델을 내보낼 때 ONNX를 선택하면, 학습에 쓴 프레임워크와 무관하게 다양한 런타임에서 실행할 수 있습니다.

"onnc"는 맥락에 따라 ONNX의 오타로 쓰이기도 하고, 별도로 ONNC(Open Neural Network Compiler, SKYMIZER)를 가리키기도 합니다. 하지만 Roboflow에서 내보내는 파일 포맷은 `.onnx`이고, 추론에는 `onnxruntime`을 사용하는 게 일반적입니다.

## 모델 파일 구조와 입출력

ONNX 모델은 계산 그래프를 직렬화한 단일 `.onnx` 파일 하나로 배포됩니다. YOLOv8 기반 Safety Helmet 모델의 경우 입출력 형태는 대략 다음과 같습니다:

- **입력**: `[1, 3, 640, 640]` — 배치 1, RGB, 640×640 픽셀 이미지
- **출력**: `[1, 5, 8400]` — 박스 좌표(cx, cy, w, h) + 클래스 점수

8400은 YOLOv8이 내부적으로 생성하는 앵커 후보 수입니다. 후처리 단계(NMS, Non-Maximum Suppression)에서 신뢰도 임계값 아래의 박스를 걸러내면 실제 탐지 결과만 남습니다.

## Python으로 추론해 보기

`onnxruntime`만 있으면 PyTorch 없이도 추론이 가능합니다.

```bash
pip install onnxruntime opencv-python
```

**추론 코드 예시**

```python
import cv2
import numpy as np
import onnxruntime as ort

session = ort.InferenceSession("safety-helmet.onnx", providers=["CPUExecutionProvider"])
input_name = session.get_inputs()[0].name

img = cv2.imread("site.jpg")
img_resized = cv2.resize(img, (640, 640))
img_input = img_resized.transpose(2, 0, 1)[np.newaxis, ...].astype(np.float32) / 255.0

outputs = session.run(None, {input_name: img_input})
# outputs[0].shape == (1, 5, 8400)
```

실제 바운딩 박스를 그리려면 출력 텐서에서 신뢰도(`conf`) 기준으로 필터링하고 원본 이미지 크기에 맞게 좌표를 역변환해야 합니다. Roboflow의 `inference` SDK를 쓰면 이 후처리 로직이 감춰져 있어 코드가 훨씬 짧아집니다.

```python
from inference import get_model

model = get_model("safety-helmet-detection/1")
results = model.infer("site.jpg")
print(results)  # 바운딩 박스 + 클래스 레이블 리스트
```

## 직접 쓸 때 주의할 점

**데이터 편향**: Roboflow Universe의 Safety Helmet 모델은 특정 헬멧 색상(주로 노란색·주황색·흰색)에 치우쳐 있는 경우가 많습니다. 현장 헬멧이 다양한 색상이라면 파인튜닝이 필요할 수 있습니다.

**해상도와 속도**: 640×640 입력이 기본이라 저사양 기기에서 실시간 처리를 하려면 모델 경량화(INT8 양자화, TensorRT 변환 등)를 검토해야 합니다.

**각도·가림**: 측면이나 후면에서 촬영된 헬멧, 또는 헬멧이 부분적으로 가려진 경우 탐지 정확도가 낮아질 수 있습니다. 카메라 설치 위치가 성능에 직접적인 영향을 줍니다.

**라이선스 확인**: Roboflow Universe의 모델마다 라이선스가 다릅니다. 상업 용도로 사용할 경우 해당 모델 페이지의 라이선스 조항을 반드시 확인하세요.

---

처음부터 데이터를 모으고 학습시키는 대신, Roboflow의 사전 학습 ONNX 모델을 출발점으로 삼으면 PoC를 빠르게 만들 수 있습니다. 거기서 실제 현장 데이터로 파인튜닝하는 흐름이 실용적이라고 생각합니다.
