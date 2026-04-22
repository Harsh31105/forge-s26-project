import { getStudent } from "@/src/lib/api/student";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    GetStudentsParams,
    StudentPostInput,
    StudentPatchInput
} from "@/src/lib/api/northStarAPI.schemas";
import { customAxios } from "@/src/lib/api/apiClient";

export function useStudents(params?: GetStudentsParams) {
    const studentAPI = getStudent();

    const {
        data: studentsData,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ["students", params],
        queryFn: () => studentAPI.getStudents(params),
    });

    return { students: studentsData || [], isLoading, error: error?.message || null, refetch };
}

export function useStudent(studentID: string) {
    const studentAPI = getStudent();

    const {
        data: student,
        isLoading,
        error,
        refetch,
    } = useQuery({
       queryKey: ["students", studentID],
       queryFn: () => studentAPI.getStudentsId(studentID),
       enabled: !!studentID,
    });

    return { student, isLoading, error: error?.message || null, refetch };
}

export function useStudentByEmail(email: string) {
    const studentAPI = getStudent();

    const {
        data: student,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["students", "email", email],
        queryFn: () => studentAPI.getStudentsEmailEmail(email),
        enabled: !!email,
    });

    return { student, isLoading, error: error?.message || null, refetch };
}

export function useStudentMutations() {
    const queryClient = useQueryClient();
    const studentAPI = getStudent();

    const createMutation = useMutation({
        mutationFn: (input: StudentPostInput) => studentAPI.postStudents(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["students"] });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ studentID, input }: {
            studentID: string;
            input: StudentPatchInput;
        }) => studentAPI.patchStudentsId(studentID, input),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["students"] });
            queryClient.invalidateQueries({ queryKey: ["students", variables.studentID] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (studentID: string) => studentAPI.deleteStudentsId(studentID),
        onSuccess: (_, studentID) => {
            queryClient.invalidateQueries({ queryKey: ["students"] });
            queryClient.removeQueries({ queryKey: ["students", studentID] });
        }
    });

    return {
        createStudent: createMutation.mutateAsync,
        updateStudent: updateMutation.mutateAsync,
        deleteStudent: deleteMutation.mutateAsync,

        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,

        createError: createMutation.error?.message || null,
        updateError: updateMutation.error?.message || null,
        deleteError: deleteMutation.error?.message || null,
    };
}

export function useUploadProfilePicture(studentID: string) {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (file: File) => {
            const formData = new FormData();
            formData.append("profilePicture", file);
            return customAxios<{ profilePictureUrl?: string | null }>({
                url: `/students/${studentID}`,
                method: "PATCH",
                headers: { "Content-Type": undefined },
                data: formData,
            });
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["students", studentID] });
            queryClient.invalidateQueries({ queryKey: ["currentUser"] });
            // Directly patch the ["me"] cache with the presigned URL from the PATCH response
            // instead of relying on /auth/me to regenerate it
            if (data?.profilePictureUrl) {
                queryClient.setQueryData(["me"], (old: any) =>
                    old ? { ...old, profilePictureUrl: data.profilePictureUrl } : old
                );
            } else {
                queryClient.invalidateQueries({ queryKey: ["me"] });
            }
        },
    });

    return {
        uploadProfilePicture: mutation.mutateAsync,
        isUploading: mutation.isPending,
        uploadError: mutation.error?.message || null,
    };
}