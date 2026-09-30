# 课堂巡视员：手机使用识别——信号检测论（SDT）交互实验

这是一个**解压后即可运行**的纯前端课程作业版本，不需要安装 npm、Flask，也不需要再去 Roboflow 下载完整数据集。

## 一、直接运行

推荐放到：

```text
/Users/wangxinyi/Documents/trae_projects/xinli/sdt_classroom_phone_ready
```

### 方法 A：最简单
直接双击：

```text
index.html
```

### 方法 B：推荐
终端执行：

```bash
cd /Users/wangxinyi/Documents/trae_projects/xinli/sdt_classroom_phone_ready
python3 -m http.server 8000
```

然后浏览器打开：

```text
http://localhost:8000
```

## 二、数据已经接入，不需要再下载

为了避免为了课程作业下载几千张图，本项目没有打包完整训练集，只接入了 **27 张公开预览/测试样例**：

- 15 张：Signal 候选（来自课堂手机/学生玩手机的公开 CC BY 4.0 项目）
- 12 张：Noise 候选（来自阅读、写作、举手、专注等课堂行为公开 CC BY 4.0 项目）

每轮固定抽取 20 次。若某种 P(S) 需要的某一类数量超过当前唯一样例数，程序会随机复用少量样例。

**图片本体通过公开的 Roboflow `source.roboflow.com` **original.jpg 原图地址**加载，不再使用缩略图，因此清晰度明显提高。首次使用建议联网。**
为了保证“直接运行”，每一条数据都另外配了本地 SVG fallback：若公开图片加载失败，网页会自动切换到本地课堂刺激，不会中断实验。

## 三、作业评分点对应

### 1. 场景与参数定义（15%）
- Signal：画面中存在手机使用行为
- Noise：画面中不存在手机使用行为
- P(S)：0.30 / 0.50 / 0.70
- Hit / Miss / False Alarm / Correct Rejection 均有课堂场景解释

### 2. 游戏交互（35%）
- 每局 20 次
- 逐张呈现课堂刺激
- 刺激呈现时间：5s / 3s / 1.5s
- 难度 / 目标 d′：简单≈2.4、中等≈1.6、困难≈0.8
- 时间结束后刺激自动遮挡

> 这里的“目标 d′”是实验难度设置，不是伪造的实验结果。最终页面上的“实测 d′”严格根据实际 Hit 与 False Alarm 计算。

### 3. SDT 计算与展示（30%）
自动统计：
- H / M / FA / CR
- P(H)
- P(FA)
- d′
- c
- Accuracy
- Mean RT

公式：

```text
P(H)  = H / (H + M)
P(FA) = FA / (FA + CR)
d′ = Z[P(H)] - Z[P(FA)]
c  = -0.5 × (Z[P(H)] + Z[P(FA)])
```

当比例恰为 0 或 1 时，只在 Z 变换阶段采用 log-linear 0.5 correction，避免无穷值；页面仍显示原始 P(H) / P(FA)。

### 4. 代码规范可运行（20%）
- HTML / CSS / JavaScript 分离
- README 完整
- 无第三方 JS 依赖
- 无需构建
- 可直接双击 `index.html`

### 5. 加分项
- Signal / Noise 正态分布交互可视化
- c 滑块
- ROC 操作点
- 多轮实验历史对比
- 响应式界面

## 四、公开数据来源

核心教育场景参考：

1. **student-behaviors — prcv, Roboflow Universe**
   - classes: Distracting, Focusing, Hand Raising, Sleeping, Using Phone, Walking
   - license: CC BY 4.0
   - https://universe.roboflow.com/prcv/student-behaviors

用于本作业 Signal / Noise 小样例的公开项目还包括：

2. **phone — StudentClassroomBehavior**
   - class: play-phone
   - CC BY 4.0
   - https://universe.roboflow.com/studentclassroombehavior/phone-pvjqg

3. **Classroom Phone Detection — Jenibars Workspace**
   - class: Classroom-Phone-Detection
   - CC BY 4.0
   - https://universe.roboflow.com/jenibars-workspace/classroom-phone-detection-lzdll

4. **Phone Detection Classroom — Shreya**
   - class: Phone-Detection-Classroom
   - CC BY 4.0
   - https://universe.roboflow.com/shreya-co0k0/phone-detection-classroom

5. **classroom phone detection — MDs Workspace**
   - classes: person, cell-phones
   - CC BY 4.0
   - https://universe.roboflow.com/mds-workspace-nsjro/classroom-phone-detection

6. **Project-20 — ICBMS**
   - classes: Reading, Eating, Raising_a_hand, Sleeping_At_a_desk, Writing
   - CC BY 4.0
   - https://universe.roboflow.com/icbms/project-20

7. **student behaviour — firass Workspace**
   - classes: reading, hand-rising, sleep, writting
   - CC BY 4.0
   - https://universe.roboflow.com/firass-workspace-0ac3z/student-behaviour-opuhl

8. **Student-behaviour-in-classroom-4 — studentclassroomanalytics**
   - classes: reading, attentive, hand-raising, teaching, writing
   - CC BY 4.0
   - https://universe.roboflow.com/studentclassroomanalytics/student-behaviour-in-classroom-4

所有具体 stimulus URL 和来源名称均保留在 `data/manifest.js`，便于核查与引用。

## 五、项目结构

```text
sdt_classroom_phone_ready/
├── index.html
├── styles.css
├── app.js
├── README.md
├── START_HERE.txt
└── data/
    ├── manifest.js
    └── fallback/
        ├── signal_01.svg ...
        └── noise_01.svg ...
```

## 六、提交前建议

1. 用 Chrome / Edge 打开网页完整做一轮。
2. 检查结果页是否正常显示 d′、c、ROC。
3. 提交整个文件夹到课程 GitHub Organization。
4. 保留 README 中的数据来源和许可证说明。


## FINAL_CLEAR 版本说明

本版本专门修正上一版图片模糊的问题：

- 在线图片全部改用 `original.jpg` 原图地址，不再用 `thumb.jpg`
- 移除了程序主动添加的 CSS 模糊效果
- Signal 仍来自课堂手机/课堂手机检测公开项目
- Noise 来自阅读、写作、举手、专注等课堂行为公开项目
- 难度主要由图片本身的目标显著性和刺激呈现时间形成

因此，联网运行时看到的是更清晰的课堂/监控原图。
