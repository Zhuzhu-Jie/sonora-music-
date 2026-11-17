# 听见 · SONORA 1.0.0

**[下载安卓 APK](https://github.com/Zhuzhu-Jie/sonora-music/raw/refs/heads/main/downloads/sonora-1.0.0.apk)** · [打开下载文件页](https://github.com/Zhuzhu-Jie/sonora-music/blob/main/downloads/sonora-1.0.0.apk) · [查看 v1.0.0 发布说明](https://github.com/Zhuzhu-Jie/sonora-music/releases/tag/v1.0.0)

本仓库为私有仓库。请先登录有权限的 GitHub 账号，再点击上面的 **下载安卓 APK**。如果直接下载不可用，请打开下载文件页，点击 **Download raw file / View raw**。文件约 5.8 MiB，传到安卓手机打开安装。APK 存放在仓库的 `downloads/` 目录，发布页提供下载入口和测试说明；源码也可从仓库或发布页的 Source code 下载。

APK SHA-256：`cf88ae5b7cda88a5b1e402350c21e4d78bd6f94e8dd2acd4fe2e12e6c089ce8f`


一个可安装到 Android 手机上的中文离线音乐学习应用。采用原生 Android 麦克风采集、本地 Java YIN 音高分析与封闭的本地 WebView 界面，无外部运行时依赖。

## 本版功能

- 6 个单元、18 节原创基础课程：声音、音名、节奏、音程、调式和声、跟唱、读谱与听写。
- 每课 3 段知识讲解、音频示范、一道自测和自动保存的课堂笔记；答对自测点亮进度。
- 68 个原创离线 WAV 音频，含 24 组可分类的音频库示范、37 个独立音符及练习素材。
- 实时跟唱训练：目标 C3–C5，显示音名、Hz、相对目标音分、平滑轨迹和 ±25 音分达标率。
- 5 题一组的音程 / 和弦听辨：固定 C4 为根音，音程含六种，和弦含四种。
- 支持多点触控的 C4–C5 合成钢琴；40–200 BPM 节拍器，支持 2/4、3/4、4/4 和点按测速。
- 本机课程进度、近似学习时长、连续学习天数、课堂笔记及各类最近 50 条训练记录。

本应用没有导入用户此前制作的网页，因为目前未提供网页或文件。内容是独立编写的基础课程；音频是合成教学示范，不是真实钢琴录音、歌曲库或教师人声。

## 安装

1. 将 `sonora-1.0.0.apk` 保存到安卓手机并打开。最低 Android 8.0（API 26），建议使用已更新系统 WebView 的设备。
2. 如系统提示，只为当前使用的浏览器或文件管理器临时允许“安装未知应用”，完成后可关闭此项。遵循系统安全扫描提示，无需关闭系统安全防护。
3. 启动“听见 · 音乐学习”。所有课程、声音及工具均可离线使用。
4. 首次音高训练时，点击“开始训练”，再授予麦克风权限。拒绝授权不影响其他功能。

安装包是为本任务独立签名的初始版本，并非应用商店审核版本。可用同目录的 SHA256SUMS 与证书信息核对文件。

## 开始学习

推荐路线：每天一课，先阅读，再听示范，完成自测，最后写一句笔记。每日 15 分钟的具体练习路径见第 18 课。

训练音准：练习 → 音高训练 → 选择舒适的目标音 → 听参考音 → 开始训练 → 轻声持续哼唱 2–4 秒 → 结束查看结果。使用耳机与安静环境，避免扬声器播放的参考音被当作你的声音。单次训练最长 60 秒，结束或进入后台会立即停止原生采音。

负音分表示低于所选目标，正音分表示高于目标。目标相差八度会显示约 ±1200 音分。刻度和曲线显示范围为 ±100 音分，范围外的数值会压到边缘，精确估计值在文字中显示。±25 音分是本应用的练习容差，不是统一的专业评分标准。

至少 10 个有效采样才生成摘要。声音太轻、无周期性或噪声较多时不计入成绩。统计使用原始有效采样，视觉指针和曲线使用最近 5 个有效采样的中位数；二者可能存在短暂差异。默认标准音 A4=440 Hz，十二平均律，适合单音练习，不适合多人合唱、伴奏或完整歌曲评分。

## 隐私与安全

安装包只声明 `RECORD_AUDIO`，不声明 `INTERNET`。不含账户、广告 SDK、追踪或遥测，不读联系人、位置、相册或其他文件。录音片段仅在内存里分析，不保存为文件、不上传。仅保存训练数字摘要。系统自动备份关闭。

本地页面采用 HTTPS 虚拟来源拦截，严格限定安装包 assets；禁止 WebView 文件、内容 URI 和网络访问，拦截外部导航，CSP 限制资源来源。JavaScript 接口只有开始采音、结束采音与关闭 Activity，无任意文件操作或执行入口。笔记作为文本呈现，防止被当作 HTML 执行。Release 不允许 WebView 调试。

“我的 → 清除本机学习记录”会要求再次确认，之后删除全部课程进度、笔记和摘要。卸载应用或在安卓系统里清除应用存储也会丢失记录。当前没有云同步或导出备份。

本版完成开发验证，但未经过独立安全审计，也尚未覆盖所有品牌手机的麦克风和系统差异，无法承诺绝对安全或专业设备级测量精度。

## 源码与构建

目录：

- `app/src/main/java/cn/sonora/music/MainActivity.java`：Activity、权限、生命周期与受限本地 WebView。
- `PitchDetector.java`：本地 YIN 算法；22050 Hz 单声道，2048 样本帧。
- `app/src/main/assets/`：中文界面、课程数据与离线 WAV。
- `make_content.py`：原创课程与音频的可重复生成脚本，只使用 Python 标准库。
- `tests/PitchDetectorTest.java`：纯音、泛音、音分偏移、静音、噪声等信号检查。
- `tests/ui_check.py`：Playwright 界面与流程验证。
- `build.sh`：不依赖 Gradle 的 SDK 构建、对齐与签名流程。

标准方式：Android Studio 打开项目，使用 JDK 17+、Android SDK 35、Gradle 8.11.1（已附固定版本和发行包 SHA-256 校验的 Gradle Wrapper），执行 `./gradlew assembleDebug` 构建 debug APK。AGP 版本 8.9.1。Release 需自行配置签名。

命令行方式：安装 JDK、Android SDK platform 35、build-tools 35.0.0，运行：

```sh
export ANDROID_HOME=/path/to/android-sdk
./build.sh
```

没有 javac 时可设置 `ECJ_JAR=/path/to/ecj-3.40.0.jar` 使用 Eclipse 编译器。`build.sh` 首次运行会生成独立的本地签名，私钥与密码只写在 `.local-signing/` 中；它们不包含在源码压缩包内。自行生成的新签名不能覆盖安装本次交付 APK，需卸载旧版或保持自己的签名以便之后更新。卸载前请留意本机记录丢失。

应用自身没有第三方库依赖。构建工具（Android SDK / ECJ / Gradle / AGP）遵循各自许可；源码和课程、合成音频是本任务新增作品，不包含第三方歌曲授权。

## 验证

详见随交付提供的《验证记录.md》。浏览器流程检查使用模拟的原生桥回调；另外已在 Android 9 模拟器上完成原生安装、启动、权限拒绝与授权、采音与后台停止检查，并核对离线音频进入系统输出轨道。尚未进行真机人声精度与音频延迟测试。合成信号、模拟器与真机效果应分别理解。

### 重跑检查

```sh
javac -d build/test-classes app/src/main/java/cn/sonora/music/PitchDetector.java tests/PitchDetectorTest.java
java -cp build/test-classes cn.sonora.music.PitchDetectorTest
python3 tests/audit_assets.py
python3 -m pip install -r tests/requirements.txt
python3 -m http.server 8787 --bind 127.0.0.1 --directory app/src/main/assets
# 在另一个终端运行，需已安装 Chromium 或设置 CHROMIUM_BIN
python3 tests/ui_check.py
# 需 adb 和已启动、已授权的安卓模拟器或设备
python3 tests/android_smoke.py
```

`tests/capture_preview.py` 只生成界面预览，字体路径面向 Linux Noto 字体安装，不参与核心验收。Gradle Wrapper 的工具许可见 `gradle/LICENSE`。
