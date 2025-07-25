<!--
Copyright (c) 2025 The Linux Foundation and each contributor.
SPDX-License-Identifier: MIT
-->
<template>
  <lfx-project-load-state
    :status="status"
    :error="error"
    error-message="Error fetching top organizations"
    :is-empty="isEmpty"
  >
    <div
      v-if="!isPending && tableData?.length"
      class="lfx-table explore-tables mt-0.5"
    >
      <div
        v-for="(row, index) in tableData"
        :key="index"
        class="lfx-table-row"
      >
        <div class="name-col grow !gap-3">
          <div
            class="mr-1 text-neutral-400 text-xs"
          >
            #{{ index + 1 }}
          </div>
          <lfx-avatar
            :src="row.logo"
            type="organization"
          />
          <div
            class="text-ellipsis overflow-hidden"
            :title="row.displayName"
          >
            {{ row.displayName }}
          </div>
        </div>
      </div>

    </div>
  </lfx-project-load-state>
</template>

<script setup lang="ts">
import { computed, onServerPrefetch } from 'vue';
import { EXPLORE_API_SERVICE } from '~/components/modules/explore/services/explore.api.service';
import LfxAvatar from "~/components/uikit/avatar/avatar.vue";
import { isEmptyData } from '~/components/shared/utils/helper';
import LfxProjectLoadState from "~/components/modules/project/components/shared/load-state.vue";

const props = defineProps<{
  isFullList?: boolean;
}>();

const {
  data,
  isPending,
  status,
  error,
  suspense
} = EXPLORE_API_SERVICE.fetchTopOrganizations(props.isFullList ? 100 : 10);

const tableData = computed(() => data.value);

const isEmpty = computed(() => isEmptyData(tableData.value as unknown as Record<string, unknown>[]));

onServerPrefetch(async () => {
  await suspense();
});
</script>

<script lang="ts">
export default {
  name: 'LfxExploreTopOrganizations'
};
</script>
