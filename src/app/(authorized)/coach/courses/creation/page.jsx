'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, ChevronDown, CircleAlert, Plus, Trash2, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { sendData } from '@/lib/api';
import { _throwError } from '@/lib/formatter';

const LANGUAGES = ['English', 'Hindi', 'Spanish', 'French', 'Other'];
const LECTURE_TYPES = [
  { value: 'video', label: 'Video' },
  { value: 'pdf', label: 'PDF' },
];

const createInitialMeta = () => ({
  title: '',
  description: '',
  categories: [],
  language: LANGUAGES[0],
  amount: '',
});

const createEmptyLecture = () => ({
  id: `lecture-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  title: '',
  description: '',
  lectureType: 'video',
});

const sanitizeCoursePayload = (meta, lectures) => {
  const safeCategories = meta.categories.map((category) => category.trim()).filter(Boolean);
  const amountNumber = Number(meta.amount);
  return {
    title: meta.title.trim(),
    description: meta.description.trim(),
    categories: safeCategories,
    language: meta.language,
    amount: Number.isFinite(amountNumber) ? amountNumber : 0,
    lectures: lectures.map(({ title, description, lectureType }) => ({
      title: title.trim(),
      description: description.trim() || undefined,
      lectureType,
    })),
  };
};

export default function CourseCreationPage() {
  const [meta, setMeta] = useState(createInitialMeta);
  const [lectures, setLectures] = useState([createEmptyLecture()]);
  const [stage, setStage] = useState('draft');
  const [validationErrors, setValidationErrors] = useState({ meta: {}, lectures: '' });
  const [lectureUploads, setLectureUploads] = useState({});
  const [createdCourseMeta, setCreatedCourseMeta] = useState(null);

  const isUploadStage = stage === 'uploads';
  const uploadsComplete =
    isUploadStage &&
    lectures.every((lecture) => lectureUploads[lecture.id]?.status === 'uploaded');

  const handleResetFlow = () => {
    setMeta(createInitialMeta());
    setLectures([createEmptyLecture()]);
    setStage('draft');
    setLectureUploads({});
    setValidationErrors({ meta: {}, lectures: '' });
  };

  async function handleCourseCreate() {
    const payload = sanitizeCoursePayload(meta, lectures);
    const metaErrors = {
      title: !payload.title,
      description: !payload.description,
      categories: payload.categories.length === 0,
      amount: payload.amount <= 0,
    };

    let lecturesError = '';
    if (payload.lectures.length === 0) {
      lecturesError = 'Add at least one lecture.';
    } else if (payload.lectures.some((lecture) => !lecture.title || !lecture.lectureType)) {
      lecturesError = 'Every lecture needs a title and type.';
    }

    const hasErrors = Object.values(metaErrors).some(Boolean) || Boolean(lecturesError);

    setValidationErrors({
      meta: metaErrors,
      lectures: lecturesError,
    });

    if (hasErrors) {
      return;
    }

    setLectureUploads(
      lectures.reduce((acc, lecture) => {
        acc[lecture.id] = { status: 'idle', fileName: '' };
        return acc;
      }, {})
    );

    try {
      const response = await sendData("app/courses/create-course", payload);
      console.log('Course creation response', response);
      if (response.status_code !== 200) throw new Error(response.message)
      setCreatedCourseMeta(response.data)
      toast.success(response.message || "Successfully created the course!")
      setStage('uploads');
    } catch (error) {
      toast.error(error.message || "Please try again later!")
    }
  };

  const updateUploadRecord = (lectureId, updater) => {
    setLectureUploads((prev) => {
      const previous = prev[lectureId] || { status: 'idle', fileName: '' };
      return {
        ...prev,
        [lectureId]: typeof updater === 'function' ? updater(previous) : updater,
      };
    });
  };

  const handleUploadSelect = (lectureId, file) => {
    updateUploadRecord(lectureId, (previous) => ({
      ...previous,
      status: file ? 'selected' : 'idle',
      fileName: file?.name || '',
    }));
  };

  const handleUploadComplete = (lectureId) => {
    try {
      const lecture = (createdCourseMeta
        ?.lectures || [])
        ?.find(lecture => lecture._id === lectureId)
      console.log(lectureId, lecture)
      if (!lecture) return;

      _throwError()

      updateUploadRecord(lectureId, (previous) => ({
        ...previous,
        status: 'uploaded',
      }));
    } catch (error) {
      toast.error(error.message || "Please try again later!")
    }
  };

  return (
    <div className="content-container content-height-screen py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <CourseHeader stage={stage} onReset={handleResetFlow} />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-6">
            <SectionCard
              title="Course Meta"
              description="Capture the essential details that define this course."
            >
              <CourseMetaForm
                meta={meta}
                onChange={setMeta}
                disabled={isUploadStage}
                validationMap={validationErrors.meta}
              />
            </SectionCard>

            <SectionCard
              title="Lectures"
              description="List each lecture and mark whether it is a video or a PDF."
            >
              <LecturesConfigurator
                lectures={lectures}
                setLectures={setLectures}
                disabled={isUploadStage}
                errorMessage={validationErrors.lectures}
              />
            </SectionCard>

            <SectionCard title="Create Course">
              <CourseCreationActions
                stage={stage}
                onCreate={handleCourseCreate}
                onReset={handleResetFlow}
                disabled={isUploadStage}
              />
            </SectionCard>
          </div>

          <div className="flex flex-col gap-6">
            <AssetUploadPanel
              visible={isUploadStage}
              lectures={lectures}
              uploads={lectureUploads}
              onFileSelect={handleUploadSelect}
              onMarkUploaded={handleUploadComplete}
              uploadsComplete={uploadsComplete}
              createdCourseMeta={createdCourseMeta}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function CourseHeader({ stage, onReset }) {
  return (
    <div className="flex flex-col gap-2 rounded-[6px] border border-slate-200 bg-white p-5 shadow-[0px_14px_32px_rgba(15,23,42,0.08)] lg:flex-row lg:items-center lg:justify-between">
      <div>
        {/* <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Coach / Courses / Creation
        </p> */}
        <h1 className="text-2xl font-semibold text-slate-900">Course Creation</h1>
        {/* <p className="text-sm text-slate-500">
          Define the course meta data, prepare lectures, and then upload the supporting files.
        </p> */}
      </div>
      {stage === 'uploads' ? (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center justify-center rounded-[6px] border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Start another course
        </button>
      ) : null}
    </div>
  );
}

function SectionCard({ title, description, children }) {
  return (
    <section className="rounded-[6px] border border-slate-200 bg-white p-5 shadow-[0px_14px_32px_rgba(15,23,42,0.08)]">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {description ? <p className="text-sm text-slate-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function CourseMetaForm({ meta, onChange, disabled, validationMap }) {
  const updateField = (field, value) => {
    onChange((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const removeCategory = (category) => {
    onChange((previous) => ({
      ...previous,
      categories: previous.categories.filter((item) => item !== category),
    }));
  };

  const addCategory = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextCategory = (formData.get('category-input') || '').toString().trim();

    if (!nextCategory) return;

    onChange((previous) => ({
      ...previous,
      categories: Array.from(new Set([...previous.categories, nextCategory])),
    }));
    event.currentTarget.reset();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Course title
          <input
            type="text"
            value={meta.title}
            onChange={(event) => updateField('title', event.target.value)}
            disabled={disabled}
            className={`rounded-[6px] border px-4 py-2 text-base outline-none transition focus:ring-2 focus:ring-[var(--accent-1)] ${validationMap.title ? 'border-rose-300' : 'border-slate-200'
              }`}
            placeholder="JavaScript Mastery"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Language
          <select
            value={meta.language}
            onChange={(event) => updateField('language', event.target.value)}
            disabled={disabled}
            className="rounded-[6px] border border-slate-200 px-4 py-2 text-base outline-none transition focus:ring-2 focus:ring-[var(--accent-1)]"
          >
            {LANGUAGES.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Description
        <textarea
          value={meta.description}
          onChange={(event) => updateField('description', event.target.value)}
          disabled={disabled}
          rows={4}
          className={cn(
            "rounded-[6px] border px-4 py-3 text-base outline-none transition focus:ring-2 focus:ring-[var(--accent-1)]",
            validationMap.description ? 'border-rose-300' : 'border-slate-200'
          )}
          placeholder="Deep dive into modern JavaScript"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        Amount (₹)
        <input
          type="number"
          min="0"
          value={meta.amount}
          onChange={(event) => updateField('amount', event.target.value)}
          disabled={disabled}
          className={`rounded-[6px] border px-4 py-2 text-base outline-none transition focus:ring-2 focus:ring-[var(--accent-1)] ${validationMap.amount ? 'border-rose-300' : 'border-slate-200'
            }`}
          placeholder="50000"
        />
      </label>

      <div className="flex flex-col gap-4">
        <span className="text-sm font-medium text-slate-700">Categories</span>
        {meta.categories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {meta.categories.map((category) => (
              <button
                key={category}
                type="button"
                disabled={disabled}
                onClick={() => removeCategory(category)}
                className="group inline-flex items-center gap-2 rounded-[6px] border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-600 transition hover:bg-rose-50 hover:text-rose-600"
              >
                {category}
                <span className="text-xs text-slate-400 group-hover:text-rose-500">×</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Add at least one category.</p>
        )}
        <form onSubmit={addCategory} className="flex gap-2">
          <input
            name="category-input"
            type="text"
            disabled={disabled}
            className={`flex-1 rounded-[6px] border px-4 py-2 text-base outline-none transition focus:ring-2 focus:ring-[var(--accent-1)] ${validationMap.categories ? 'border-rose-300' : 'border-slate-200'
              }`}
            placeholder="e.g. javascript"
          />
          <button
            type="submit"
            disabled={disabled}
            className="inline-flex items-center gap-1 rounded-[6px] bg-[var(--accent-1)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-1)]/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </form>
      </div>
    </div>
  );
}

function LecturesConfigurator({ lectures, setLectures, disabled, errorMessage }) {
  const [openLectureId, setOpenLectureId] = useState(() => lectures[0]?.id ?? null);

  useEffect(() => {
    if (lectures.length === 0) {
      setOpenLectureId(null);
      return;
    }
    if (!lectures.some((lecture) => lecture.id === openLectureId)) {
      setOpenLectureId(lectures[0]?.id ?? null);
    }
  }, [lectures, openLectureId]);

  const updateLecture = (lectureId, field, value) => {
    setLectures((previous) =>
      previous.map((lecture) =>
        lecture.id === lectureId ? { ...lecture, [field]: value } : lecture
      )
    );
  };

  const removeLecture = (lectureId) => {
    setLectures((previous) => previous.filter((lecture) => lecture.id !== lectureId));
  };

  const addLecture = () => {
    setLectures((previous) => [...previous, createEmptyLecture()]);
  };

  const toggleLecture = (lectureId) => {
    setOpenLectureId((previous) => (previous === lectureId ? null : lectureId));
  };

  return (
    <div className="flex flex-col gap-4">
      {lectures.length === 0 ? (
        <EmptyState message="No lectures defined yet. Start by adding a lecture." />
      ) : (
        <div className="flex flex-col gap-4">
          {lectures.map((lecture, index) => {
            const isOpen = openLectureId === lecture.id;
            return (
              <div
                key={lecture.id}
                className="overflow-hidden rounded-[6px] border border-slate-200 shadow-[0px_10px_26px_rgba(15,23,42,0.08)]"
              >
                <div
                  type="button"
                  onClick={() => toggleLecture(lecture.id)}
                  className="flex w-full items-center justify-between gap-3 bg-white px-4 py-3 text-left cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Lecture {index + 1}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {lecture.title || 'Untitled lecture'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeLecture(lecture.id);
                      }}
                      disabled={disabled || lectures.length === 1}
                      className="inline-flex items-center gap-1 rounded-[6px] border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                </div>
                {isOpen ? (
                  <div className="border-t border-slate-200 bg-slate-50 p-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                        Title
                        <input
                          type="text"
                          value={lecture.title}
                          onChange={(event) =>
                            updateLecture(lecture.id, 'title', event.target.value)
                          }
                          disabled={disabled}
                          className="rounded-[6px] border border-slate-200 px-3 py-2 text-base outline-none transition focus:ring-2 focus:ring-[var(--accent-1)]"
                          placeholder="JS Basics"
                        />
                      </label>
                      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                        Type
                        <select
                          value={lecture.lectureType}
                          onChange={(event) =>
                            updateLecture(lecture.id, 'lectureType', event.target.value)
                          }
                          disabled={disabled}
                          className="rounded-[6px] border border-slate-200 px-3 py-2 text-base outline-none transition focus:ring-2 focus:ring-[var(--accent-1)]"
                        >
                          {LECTURE_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label className="mt-3 flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                      Description (optional)
                      <textarea
                        rows={3}
                        value={lecture.description}
                        onChange={(event) =>
                          updateLecture(lecture.id, 'description', event.target.value)
                        }
                        disabled={disabled}
                        className="rounded-[6px] border border-slate-200 px-3 py-2 text-base outline-none transition focus:ring-2 focus:ring-[var(--accent-1)]"
                        placeholder="What will learners cover?"
                      />
                    </label>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {errorMessage ? (
        <div className="inline-flex items-center gap-2 rounded-[6px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
          <CircleAlert className="h-4 w-4" />
          {errorMessage}
        </div>
      ) : null}

      <button
        type="button"
        onClick={addLecture}
        disabled={disabled}
        className="inline-flex w-full items-center justify-center gap-2 rounded-[6px] border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-[var(--accent-1)] hover:text-[var(--accent-1)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Plus className="h-4 w-4" />
        Add another lecture
      </button>
    </div>
  );
}

function CourseCreationActions({ stage, onCreate, onReset, disabled }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-slate-500">
        Once you are satisfied with the meta data and lecture list, create the course to unlock the upload
        workflow.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onCreate}
          disabled={disabled}
          className="inline-flex flex-1 items-center justify-center rounded-[6px] bg-[var(--accent-1)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-1)]/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Create Course
        </button>
        {stage === 'uploads' ? (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex flex-1 items-center justify-center rounded-[6px] border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Reset form
          </button>
        ) : null}
      </div>
      {stage !== 'uploads' ? (
        <p className="text-xs text-slate-400">
          Tip: you can continue editing until the course is created.
        </p>
      ) : null}
    </div>
  );
}

function AssetUploadPanel({
  visible,
  lecturess,
  uploads,
  onFileSelect,
  onMarkUploaded,
  uploadsComplete,
  createdCourseMeta,
}) {
  const lectures = createdCourseMeta?.lectures || [];
  // console.log('createdCourseMeta', createdCourseMeta)
  if (!visible) {
    return (
      <SectionCard
        title="Upload Assets"
        description="Uploads unlock after the course is created."
      >
        <EmptyState message="Create the course to start uploading lecture files." />
      </SectionCard>
    );
  }

  const uploadedCount = lectures.filter(
    (lecture) => uploads[lecture._id]?.status === 'uploaded'
  ).length;

  return (
    <SectionCard
      title="Upload Assets"
      description="Attach the required files for every lecture."
    >
      <div className="mb-4 rounded-[6px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {uploadedCount}/{lectures.length} lectures uploaded
      </div>

      <div className="flex flex-col gap-4">
        {lectures.map((lecture) => {
          const upload = uploads[lecture._id] || { status: 'idle', fileName: '' };
          const accept = lecture.lectureType === 'video' ? 'video/*' : '.pdf';
          return (
            <div
              key={lecture._id}
              className="rounded-[6px] border border-slate-200 p-4 shadow-[0px_10px_26px_rgba(15,23,42,0.08)]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{lecture.title || 'Untitled lecture'}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    {lecture.lectureType === 'video' ? 'Video' : 'PDF'} upload
                  </p>
                </div>
                <UploadStatusBadge status={upload.status} />
              </div>

              <label className="mt-4 flex flex-col gap-2 text-sm font-medium text-slate-600">
                Select file
                <div className="flex flex-wrap gap-2">
                  <input
                    type="file"
                    accept={accept}
                    onChange={(event) =>
                      onFileSelect(lecture._id, event.target.files?.[0] || null)
                    }
                    className="flex-1 rounded-[6px] border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-[6px] file:border-0 file:bg-[var(--accent-1)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Marking uploaded', lecture)
                      onMarkUploaded(lecture._id)
                    }}
                    disabled={!upload.fileName}
                    className="inline-flex items-center gap-2 rounded-[6px] bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                  >
                    <UploadCloud className="h-4 w-4" />
                    Mark uploaded
                  </button>
                </div>
                {upload.fileName ? (
                  <span className="text-xs text-slate-500">{upload.fileName}</span>
                ) : (
                  <span className="text-xs text-slate-400">
                    Accepted formats: {lecture.lectureType === 'video' ? 'video/*' : '.pdf'}
                  </span>
                )}
              </label>
            </div>
          );
        })}
      </div>

      {uploadsComplete ? (
        <div className="mt-4 inline-flex w-full items-center gap-2 rounded-[6px] bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          All lectures are uploaded. You can now notify the backend service.
        </div>
      ) : (
        <p className="mt-4 text-xs text-slate-400">
          Upload every lecture to finish. Videos typically take longer to process.
        </p>
      )}
    </SectionCard>
  );
}

function UploadStatusBadge({ status }) {
  const toneMap = {
    idle: 'bg-slate-100 text-slate-600',
    selected: 'bg-amber-100 text-amber-700',
    uploaded: 'bg-emerald-100 text-emerald-700',
  };
  const labelMap = {
    idle: 'Pending',
    selected: 'Ready to upload',
    uploaded: 'Uploaded',
  };

  return (
    <span className={`rounded-[6px] px-3 py-1 text-xs font-semibold ${toneMap[status] || toneMap.idle}`}>
      {labelMap[status] || labelMap.idle}
    </span>
  );
}

function EmptyState({ message }) {
  return (
    <div className="rounded-[6px] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

async function uploadLectureFile(lecture, courseId, file, options) {
  if (lecture.lectureType === 'video') {
    return await uploadVideo(lecture, courseId, file, options);
  }
  return await uploadPDF(lecture, courseId, file)
}

async function uploadPDF(lecture, courseId, file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('lectureId', lecture._id);
    formData.append('courseId', courseId);
    const response = await sendData("app/courses/lectures/pdf", formData);
    if (response.status_code !== 200) throw new Error(response.message);
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    return {
      success: false,
      message: error.message || "Please try again later!"
    }
  }
}

async function uploadVideo(lecture, courseId, file, { onChunkUploaded = Function } = {}) {
  try {
    const chunks = splitFileIntoChunks(file, 5);
    for (const chunk of chunks) {
      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('lectureRef', lecture._id);
      const response = await sendData("app/courses/lectures/video", formData);
      if (response.status_code !== 200) throw new Error(response.message);
      onChunkUploaded(prev => prev + 1)
    }
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    return {
      success: false,
      message: error.message || "Please try again later!"
    }
  }
}

function splitFileIntoChunks(file, chunkSize) {
  const chunks = [];
  for (let i = 0; i < file.size; i += chunkSize) {
    chunks.push(file.slice(i, i + chunkSize));
  }
  return chunks;
}