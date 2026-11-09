# 后台接入、GitHub Pages 部署与数据核验

## 第1步：先创建课程项目

1. 在课程网站 `https://attention-lab-production.up.railway.app/hw2` 创建一个新项目（最多3个）。
2. 得到**6位项目码**（公开）和**下载密钥**（保密）。
3. 打开 `js/config.js`，把 `PROJECT_CODE: "REPLACE_ME"` 改为6位真实项目码；**禁止把下载密钥放在这个文件里**。
4. 项目码在网站被试端自动读取；不能让每名参与者自己输入一个不相同的项目码。

## 第2步：调试与正式收数分开

1. 调试时把 `js/config.js` 中 `TEST_MODE` 改成 `true`，实验名会变为 `test_flanker_improved` / `test_graphical_improved`。
2. 完整体验两项实验，确认每项正式试次是 48 / 24，且每个结束页显示“后台确认已收到”及 `record_id`。
3. 如果后台返回 `warnings`，应核对后端导出的CSV，查明字段截断或类型转换。
4. 调试完将 `TEST_MODE` **改回 `false`**，并到 `/hw2` 清理测试记录；正式招募后不再用自己测试的数据充人数。

## 第3步：GitHub Pages

1. 将本文件夹里的 `index.html`、`flanker.html`、`graphical.html`、`analysis.html`、`css/`、`js/` 等上传到一个GitHub仓库**根目录**。`index.html` 不能藏在多一层文件夹中。
2. 设置仓库为公开（Settings → General → Danger Zone → Change visibility → Public）。注意不要将下载密钥、姓名或学号上传。
3. Settings → Pages → Build and deployment → Source 选择 **Deploy from a branch**，Branch 选择 `main`，Folder 选择 `/(root)`，保存。
4. 在 Pages 显示网站公开链接后，打开网页完整做一次测试，并检查后端是否收到记录。
5. 把实际可访问的链接放到仓库 README 开头的“公开实验链接”处。不要写一个假链接。

> 不愿公开整个代码仓库，也可另建只包含网页文件的公开仓库用于 Pages。需要在README中注明该公开地址。

## 第4步：按后台标准校验

- 每次提交：**单次≤256KB**、**≤2000试次**，每个试次**≤40字段**；字符串、数组长度等有后台限制；不要把整个试次数组塞进某个单独字段。
- 正式试次每个实验只 POST 一次。被试用匿名编号，不要输入真实姓名/学号。
- 上传成功后必须**检查 `ok`、`record_id`、`warnings`**。`ok:true` 不代表字段必然没有截断或转换。
- 在 `/hw2` 用**下载密钥**下载 CSV，并核验：后台新增每条记录的固定字段 `record_id`, `created_at`, `experiment`, `condition`, `participant`, `trial_index`，自定义字段可能带 `trial.` 前缀。
- 查看同一实验/被试是否有预期试次数：Flanker 48；图形比例判断 24。检查四格/两格条件平衡、RT数值、空值与重复提交。
- 测试记录使用 `test_` 前缀；正式统计前从后台清理，分析页也会排除它们。
- 后台还有单IP每分钟最多30次提交、每项目最多3000条记录等限额。我们的默认实现每位被试每个实验只提交一次，通常远低于限额。
- 若上传失败或出现 `Failed to fetch`，先保存本机 CSV/JSON，排查项目码、网络以及后台状态。不要在页面上误报“提交成功”。

## 第5步：最终提交

1. 确保真实参与者至少5人，且每实验每条件至少10个正式试次（本项目已设置12）。
2. 将真实数据分析结果和原研究比较、改进预测检验、局限独立写进 README；按课堂要求保存收数前的预测 commit。
3. 代码提交到老师指定的 GitHub Organization 仓库。GitHub Pages 是否搭建由自己选择；搭建可获得相应加分。
4. 请勿上传下载密钥、原始个人身份信息或任何虚构被试数据。
