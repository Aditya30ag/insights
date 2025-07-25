// Copyright (c) 2025 The Linux Foundation and each contributor.
// SPDX-License-Identifier: MIT
import type { QueryFunction } from '@tanstack/vue-query';
import { type ComputedRef, computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { aggregateData } from '../config/overview-aggregates';
import type { HealthScore, TrustScoreSummary } from '~~/types/overview/responses.types';
import { TanstackKey } from '~/components/shared/types/tanstack';
import type { Organization } from '~~/types/contributors/responses.types';
import { benchmarkConfigs } from '~~/app/config/benchmarks';
import type { SecurityData } from '~~/types/security/responses.types';
import type { BenchmarkKeys } from '~~/types/shared/benchmark.types';

export interface OverviewQueryParams {
  projectSlug: string;
  repos?: string[];
}

export interface ScoreDataQueryParams extends OverviewQueryParams {
  type: string;
}

// TODO: Refactor other services to follow this pattern
class OverviewApiService {
  fetchHealthScore(params: ComputedRef<OverviewQueryParams>) {
    const queryKey = computed(() => [
      TanstackKey.HEALTH_SCORE,
      params.value.projectSlug,
      params.value.repos
    ]);
    const queryFn = computed<QueryFunction<HealthScore[]>>(() => this.healthScoreQueryFn(() => ({
        projectSlug: params.value.projectSlug,
        repos: params.value.repos
      })));

    return useQuery<HealthScore[]>({
      queryKey,
      queryFn
    });
  }

  healthScoreQueryFn(
    query: () => Record<string, string | number | boolean | undefined | string[] | null>
  ): QueryFunction<HealthScore[]> {
    const { projectSlug, repos } = query();
    return async () => await $fetch(`/api/project/${projectSlug}/overview/health-score`, {
        params: {
          repos
        }
      });
  }

  // TODO: refactor security page to use this instead
  fetchSecurityAssessment(params: ComputedRef<OverviewQueryParams>) {
    const queryKey = computed(() => [
      TanstackKey.SECURITY_ASSESSMENT,
      params.value.projectSlug,
      params.value.repos
    ]);
    const queryFn = computed<QueryFunction<SecurityData[]>>(() => this.securityAssessmentQueryFn(() => ({
        projectSlug: params.value.projectSlug,
        repos: params.value.repos
      })));

    return useQuery<SecurityData[]>({
      queryKey,
      queryFn
    });
  }

  securityAssessmentQueryFn(
    query: () => Record<string, string | number | boolean | undefined | string[] | null>
  ): QueryFunction<SecurityData[]> {
    const { projectSlug, repos } = query();
    return async () => await $fetch(`/api/project/${projectSlug}/security/assessment`, {
        params: {
          repos
        }
      });
  }
  fetchAssociatedOrganization(params: ComputedRef<OverviewQueryParams>) {
    const queryKey = computed(() => [
      TanstackKey.ASSOCIATED_ORGANIZATION,
      params.value.projectSlug
    ]);
    const queryFn = computed<QueryFunction<Organization>>(() => this.associatedOrganizationQueryFn(() => ({
        projectSlug: params.value.projectSlug
      })));

    return useQuery<Organization>({
      queryKey,
      queryFn
    });
  }

  associatedOrganizationQueryFn(
    query: () => Record<string, string | number | boolean | undefined | string[] | null>
  ): QueryFunction<Organization> {
    const { projectSlug } = query();

    return async () => await $fetch(`/api/project/${projectSlug}/overview/associated-organization`, {
        params: {
          projectSlug
        }
      });
  }

  convertRawValuesToHealthScore(rawValues: HealthScore[]): HealthScore[] {
    return rawValues.map((value) => {
      const valueRounded = Math.ceil(value.value);
      const pointDets = this.getPointDetails(valueRounded, value.key);

      return {
        ...value,
        points: pointDets?.points
      };
    });
  }

  convertPointsToTrustSummary(
    points: HealthScore[],
    securityAssessment: number
  ): TrustScoreSummary {
    const trustSummary = {
      overall: 0,
      popularity: 0,
      contributors: 0,
      security: 0,
      development: 0
    };

    points.forEach((point) => {
      const aggData = aggregateData.find((aggregate) => aggregate.benchmarkKeys.includes(point.key));

      if (aggData) {
        let pointValue = point.points || 0;

        switch (aggData.key) {
          case 'contributors':
            // TODO: Remove this once we have 5 benchmarks available
            pointValue *= 1.25;
            trustSummary.contributors += pointValue;
            break;
          case 'popularity':
            // TODO: Remove this once we have the other benchmarks available
            pointValue *= 2.5;
            trustSummary.popularity += pointValue;
            break;
          case 'development':
            trustSummary.development += pointValue;
            break;
          default:
            trustSummary.security += pointValue;
            break;
        }

        trustSummary.overall += pointValue;
      }
    });

    if (securityAssessment) {
      trustSummary.security = securityAssessment / 4;
      trustSummary.overall += trustSummary.security;
    }

    return trustSummary;
  }

  getPointDetails(value: number, key: BenchmarkKeys) {
    const benchmarkConfig = benchmarkConfigs.find((config) => config.key === key);
    return benchmarkConfig?.points.find(
      (point) => point.pointStart <= value && (point.pointEnd === null || point.pointEnd >= value)
    );
  }

  getBenchmarkTitle(key: BenchmarkKeys) {
    const benchmarkConfig = benchmarkConfigs.find((config) => config.key === key);
    return benchmarkConfig?.title;
  }
}

export const OVERVIEW_API_SERVICE = new OverviewApiService();
