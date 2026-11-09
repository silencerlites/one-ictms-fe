<template>
  <q-page class="registry-page workspace-page">
    <header class="registry-heading">
      <div class="registry-heading__main">
        <div class="registry-heading__icon" aria-hidden="true"><q-icon name="account_tree" size="27px" /></div>
        <div class="registry-heading__copy">
          <div class="section-kicker">DSWD · ONE ICTMS <span class="registry-heading__crumb">/</span> INFORMATION SYSTEM REGISTRY</div>
          <h1>System Registry</h1>
          <p>Register, manage, and monitor information systems within the organization.</p>
        </div>
      </div>
      <div class="registry-heading__right">
        <span class="registry-live-indicator"><span class="registry-live-indicator__dot" /> Registry connected</span>
        <q-btn unelevated no-caps icon="add" label="Register New System" class="registry-add registry-heading__add" @click="openAddSystemChoice" />
      </div>
    </header>

    <section class="registry-stats" aria-label="System status summary">
      <article v-for="stat in statistics" :key="stat.label" class="registry-stat" :class="`registry-stat--${stat.theme}`">
        <div class="registry-stat__top"><span>{{ stat.label }}</span><q-icon :name="stat.icon" size="21px" /></div>
        <div class="registry-stat__body"><div class="registry-stat__icon"><q-icon :name="stat.icon" size="29px" /></div>
          <div><strong>{{ stat.count }}</strong><p>{{ stat.description }}</p></div>
        </div>
      </article>
    </section>

    <section class="registry-panel">
      <div class="registry-panel__heading">
        <div class="registry-panel__title"><span class="registry-panel__eyebrow">SYSTEM DIRECTORY</span><h2>All Systems <span class="registry-panel__count">({{ systems.length }})</span></h2><p>Browse and maintain registered information systems.</p></div>
        <div class="registry-actions">
          <q-input v-model="search" dense outlined clearable placeholder="Search system name, alias, or owner..." class="registry-search" aria-label="Search systems">
            <template #prepend><q-icon name="search" color="indigo-8" /></template>
          </q-input>
          <q-select v-model="statusFilter" dense outlined clearable emit-value map-options :options="statusOptions" label="Registry status" class="registry-status-filter" />
          <q-btn flat round icon="refresh" class="registry-refresh" :loading="loading" aria-label="Reload Registry" @click="void loadRegistries()"><q-tooltip>Refresh systems</q-tooltip></q-btn>

        </div>
      </div>
      <q-banner v-if="loadError" class="bg-red-1 text-negative q-mb-md" rounded>
        {{ loadError }} <q-btn flat label="Retry" color="negative" @click="void loadRegistries()" />
      </q-banner>
      <q-table :rows="filteredSystems" :columns="columns" row-key="id" :loading="loading && systems.length === 0" flat
        :rows-per-page-options="[5, 10, 20, 0]" v-model:pagination="pagination" class="registry-table"
        no-data-label="No registered systems found.">
        <template #body-cell-system_name="props"><q-td :props="props">
          <div class="registry-system-cell"><span class="registry-system-icon" style="background:#4857d3"><q-icon name="dns" size="19px" color="white" /></span>
            <div><strong>{{ props.row.system_name }}</strong><small>{{ props.row.alias || '—' }}</small></div>
          </div>
        </q-td></template>
        <template #body-cell-alias="props"><q-td :props="props">{{ props.row.alias || '—' }}</q-td></template>
        <template #body-cell-business_owner="props"><q-td :props="props">{{ departmentLabel(props.row.business_owner) }}</q-td></template>
        <template #body-cell-status="props"><q-td :props="props">
          <span class="registry-pill registry-pill--status" :class="statusClass(statusLabel(props.row.status))"><span class="registry-pill__dot" />{{ statusLabel(props.row.status) }}</span>
        </q-td></template>
        <template #body-cell-updated_at="props"><q-td :props="props">{{ formatDate(props.row.updated_at) }}</q-td></template>
        <template #body-cell-actions="props"><q-td :props="props">
          <q-btn flat round dense color="indigo-9" icon="more_horiz" aria-label="System actions">
            <q-menu auto-close><q-list dense style="min-width:160px">
              <q-item clickable @click="void openView(props.row.id)"><q-item-section avatar><q-icon name="visibility" /></q-item-section><q-item-section>View</q-item-section></q-item>
              <q-item clickable @click="void openEdit(props.row.id)"><q-item-section avatar><q-icon name="edit" /></q-item-section><q-item-section>Edit</q-item-section></q-item>
              <q-separator />
              <q-item clickable class="text-negative" @click="confirmDelete(props.row)"><q-item-section avatar><q-icon name="delete_outline" /></q-item-section><q-item-section>Delete</q-item-section></q-item>
            </q-list></q-menu>
          </q-btn>
        </q-td></template>
      </q-table>
    </section>

    <!-- Choose whether to register a new IS or work with one already in the Registry. -->
    <q-dialog v-model="addChoiceOpen">
      <q-card class="registry-choice-dialog">
        <q-card-section class="row items-center justify-between">
          <div><div class="text-h6 text-weight-bold">Add System</div><div class="text-caption text-grey-7">Choose how you want to continue.</div></div>
          <q-btn flat round icon="close" aria-label="Close" v-close-popup />
        </q-card-section>
        <q-card-section class="registry-choice-options">
          <button type="button" class="registry-choice-option" @click="chooseNewSystem">
            <q-icon name="add_circle_outline" size="34px" color="indigo-8" />
            <span><strong>New Information System</strong><small>Register a new system using the six-step form.</small></span>
            <q-icon name="chevron_right" size="24px" />
          </button>
          <button type="button" class="registry-choice-option" @click="chooseExistingSystem">
            <q-icon name="manage_search" size="34px" color="indigo-8" />
            <span><strong>Existing Information System</strong><small>Search an already registered IS and update its details.</small></span>
            <q-icon name="chevron_right" size="24px" />
          </button>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="existingSearchOpen">
      <q-card class="registry-existing-dialog">
        <q-card-section class="row items-center justify-between">
          <div><div class="text-h6 text-weight-bold">Find an existing IS</div><div class="text-caption text-grey-7">Select a registered system to open its details for editing.</div></div>
          <q-btn flat round icon="close" aria-label="Close" v-close-popup />
        </q-card-section>
        <q-card-section>
          <q-input v-model="existingQuery" outlined autofocus debounce="200" clearable label="Search IS name, alias or description">
            <template #prepend><q-icon name="search" /></template>
          </q-input>
        </q-card-section>
        <q-card-section class="registry-existing-results">
          <div v-if="loading" class="text-center q-pa-lg"><q-spinner color="indigo-9" size="28px" /> Loading systems...</div>
          <div v-else-if="existingMatches.length === 0" class="text-center text-grey-7 q-pa-xl">No matching registered systems found.</div>
          <q-list v-else separator>
            <q-item v-for="item in existingMatches" :key="item.id" clickable :disable="existingOpening" @click="void selectExistingSystem(item.id)">
              <q-item-section avatar><q-avatar color="indigo-1" text-color="indigo-9" icon="dns" /></q-item-section>
              <q-item-section><q-item-label class="text-weight-medium">{{ item.system_name }}</q-item-label><q-item-label caption>{{ item.alias || 'No alias' }} · {{ departmentLabel(item.business_owner) }}</q-item-label></q-item-section>
              <q-item-section side><q-spinner v-if="existingOpeningId === item.id" size="20px" color="indigo-8" /><q-icon v-else name="chevron_right" /></q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
        <q-card-actions align="right"><q-btn flat no-caps label="Back" @click="existingSearchOpen = false; addChoiceOpen = true" /><q-btn flat no-caps label="Close" v-close-popup /></q-card-actions>
      </q-card>
    </q-dialog>

    <!-- New IS: System Profile is the ONLY modal shown before a record exists. -->
    <q-dialog v-model="profileOpen" persistent transition-show="scale" transition-hide="scale">
      <q-card class="registry-profile-init-dialog">
        <q-card-section class="registry-profile-init-header">
          <div class="registry-profile-init-icon"><q-icon name="dns" size="25px" /></div>
          <div class="registry-profile-init-heading">
            <div class="registry-profile-init-eyebrow">ONE ICTMS / SYSTEM REGISTRY</div>
            <h2>Register an Information System</h2>
            <p>Set up the system profile and choose its development architecture.</p>
          </div>
          <q-btn flat round icon="close" class="registry-profile-init-close" aria-label="Close System Profile" :disable="saving" @click="profileOpen = false" />
        </q-card-section>
        <q-form @submit.prevent="void initiateSystem()">
          <q-card-section class="registry-profile-init-fields">
            <q-banner v-if="library.errors.registryStatuses || library.registryStatuses.length === 0" rounded class="bg-orange-1 text-orange-10">
              Registry Status options are unavailable. <q-btn flat no-caps color="indigo-9" label="Reload Libraries" @click="void loadLibraries()" />
            </q-banner>

            <section class="registry-profile-init-panel" aria-labelledby="registry-profile-info-heading">
              <div class="registry-profile-init-section-heading">
                <div>
                  <h3 id="registry-profile-info-heading">System information</h3>
                  <p>Provide the identifying details of your information system.</p>
                </div>
                <span class="registry-profile-init-required-hint">* Required</span>
              </div>
              <div class="registry-profile-init-inputs">
                <q-input v-model.trim="form.system_name" outlined hide-bottom-space label="System name *" :rules="[requiredText]" class="registry-profile-init-name" />
                <div class="registry-profile-init-grid">
                  <q-input v-model.trim="form.alias" outlined label="Alias" />
                  <q-select v-model="form.status" outlined hide-bottom-space label="Registry status *" :options="library.registryStatuses" option-label="name" option-value="id" emit-value map-options :rules="[requiredId]" :display-value="selectedStatusName" :disable="library.registryStatuses.length === 0" />
                </div>
                <q-input v-model.trim="form.description" type="textarea" autogrow outlined label="Description" class="registry-profile-init-description" />
                <q-select v-model="form.business_owner" outlined clearable label="Business owner (Department)" :options="departmentOptions" option-label="name" option-value="id" emit-value map-options />
              </div>
            </section>

            <section class="registry-profile-init-panel registry-profile-init-panel--architecture" aria-labelledby="registry-profile-type-heading">
              <div class="registry-profile-init-section-heading">
                <div>
                  <h3 id="registry-profile-type-heading">Development Solution Type</h3>
                  <p>Choose how this system is developed and deployed.</p>
                </div>
              </div>
              <div class="registry-profile-init-solution-grid" role="group" aria-label="Development Solution Type">
                <button v-for="option in library.developmentSolutionTypes" :key="option.id" type="button"
                  class="registry-profile-init-solution" :class="{ 'is-selected': Number(form.repo.development_solution_type) === Number(option.id) }"
                  :aria-pressed="Number(form.repo.development_solution_type) === Number(option.id)"
                  @click="selectDevelopmentSolution(Number(option.id))">
                  <span class="registry-profile-init-solution-icon"><q-icon :name="solutionTypeIcon(option.name)" size="23px" /></span>
                  <span class="registry-profile-init-solution-name">{{ option.name }}</span>
                </button>
              </div>
              <div v-if="!library.developmentSolutionTypes.length" class="text-caption text-grey-7">Development Solution Type options are not available. Check the Library API.</div>
            </section>
          </q-card-section>
          <q-separator />
          <q-card-actions class="registry-profile-init-footer">
            <div class="registry-profile-init-footer-note"><q-icon name="info_outline" size="17px" /> You can complete the remaining details after initiation.</div>
            <div class="registry-profile-init-footer-actions">
              <q-btn flat no-caps label="Cancel" :disable="saving" @click="profileOpen = false" />
              <q-btn type="submit" unelevated no-caps color="primary" icon-right="arrow_forward" label="Initiate System" :loading="saving" class="registry-profile-init-submit" />
            </div>
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <q-dialog v-model="formOpen" persistent transition-show="scale" transition-hide="scale">
      <q-card class="registry-dialog registry-dialog--wide registry-dialog--editor">
        <q-card-section class="registry-wizard-header">
          <div class="registry-wizard-header__icon"><q-icon name="app_registration" size="26px" /></div>
          <div class="registry-wizard-header__copy">
            <div class="registry-wizard-header__eyebrow">DSWD · ONE ICTMS / INFORMATION SYSTEM REGISTRY</div>
            <div class="text-h6 text-weight-bold" aria-live="polite">{{ wizardStepLabels[formStep - 1] }}</div>
            <p class="registry-wizard-header__subtitle">{{ formStep === 1 ? 'A complete, read-only overview of the registered system.' : 'Review and maintain this section of your information system.' }}</p>
          </div>
          <div class="registry-wizard-header__art" aria-hidden="true">
            <span class="registry-wizard-header__art-screen"><q-icon name="terminal" size="37px" /></span>
            <span class="registry-wizard-header__art-gear"><q-icon name="settings" size="24px" /></span>
          </div>
          <div class="registry-wizard-header__aside">
            <q-btn flat round icon="close" aria-label="Close registration" :disable="saving" @click="formOpen = false" />
          </div>
        </q-card-section>
        <div class="registry-wizard-progress" role="progressbar" :aria-valuenow="formStep" aria-valuemin="1" :aria-valuemax="stepLabels.length" aria-label="Registration section progress">
          <div class="registry-wizard-progress__fill" :style="{ width: `${(formStep / stepLabels.length) * 100}%` }"></div>
        </div>
        <q-form class="registry-wizard-form" @submit.prevent="void saveSystem()">
          <div class="registry-wizard-layout">
            <aside class="registry-wizard-sidebar" aria-label="Registration sections">
              <div class="registry-wizard-steps" aria-label="Registration progress">
              <button v-for="(label, index) in wizardStepLabels" :key="label" type="button" class="registry-wizard-step"
                :class="{ 'is-current': formStep === index + 1, 'is-complete': formStep > index + 1 }"
                :aria-current="formStep === index + 1 ? 'step' : undefined"
                :disabled="saving" @click="goToStep(index + 1)">
                
                <q-icon :name="wizardStepIcons[index]" size="20px" class="registry-wizard-step__icon" aria-hidden="true" />
                <span class="registry-wizard-step__label">{{ label }}</span>
                <q-icon v-if="formStep === index + 1" name="chevron_right" size="19px" class="registry-wizard-step__arrow" />
              </button>
              </div>
              <div class="registry-sidebar-hint"><q-icon name="info_outline" size="19px" /><span>Your updates are saved when you select Save Changes.</span></div>
            </aside>
            <q-card-section class="registry-form registry-form--scroll registry-wizard-main">
            <q-banner v-if="library.errors.registryStatuses || library.registryStatuses.length === 0" rounded class="bg-orange-1 text-orange-10 q-mb-md">
              Registry Status options are not available. Check the Registry Status Library API and make sure active statuses have been seeded.
              <q-btn flat no-caps color="indigo-9" label="Reload Libraries" @click="void loadLibraries()" />
            </q-banner>
            <div v-show="formStep === 1" class="registry-wizard-content registry-details-view">
              <section class="registry-details-section registry-details-section--unboxed" aria-label="Registry details">

                <div v-for="(section, sectionIndex) in registryOverviewSections" :key="section.title" class="registry-overview-block" :class="{ 'registry-overview-block--profile': sectionIndex === 0 }">
                  <template v-if="sectionIndex === 0">
                    <div class="registry-profile-summary">
                      <span class="registry-profile-summary__icon"><q-icon name="layers" size="26px" /></span>
                      <div class="registry-profile-summary__copy">
                        <span class="registry-profile-summary__kicker">SYSTEM PROFILE</span>
                        <h3>{{ section.fields[0]?.value || '—' }}</h3>
                      </div>
                      <span class="registry-profile-summary__status" :class="statusClass(section.fields[1]?.value || '')">
                        <span class="registry-profile-summary__dot" />{{ section.fields[1]?.value || '—' }}
                      </span>
                    </div>
                    <dl class="registry-profile-summary__details">
                      <div class="registry-profile-summary__detail">
                        <span class="registry-profile-summary__detail-icon"><q-icon name="description" size="20px" /></span>
                        <div><dt>Description</dt><dd>{{ section.fields[3]?.value || 'No description provided.' }}</dd></div>
                      </div>
                      <div class="registry-profile-summary__detail">
                        <span class="registry-profile-summary__detail-icon"><q-icon name="groups" size="20px" /></span>
                        <div><dt>Business Owner</dt><dd>{{ section.fields[2]?.value || '—' }}</dd></div>
                      </div>
                    </dl>
                  </template>
                  <template v-else>
                    <div class="registry-overview-block__heading">
                      <span class="registry-overview-heading-icon"><q-icon :name="section.icon" size="20px" /></span>
                      <h5>{{ section.title }}</h5>
                    </div>
                    <dl class="registry-details-section__fields registry-details-readonly">
                      <div v-for="field in section.fields" :key="field.label" class="registry-details-readonly__item" :class="{ 'registry-details-readonly__item--wide': field.wide, 'registry-details-readonly__item--prominent': field.prominent }">
                        <dt>{{ field.label }}</dt>
                        <dd v-if="field.status"><span class="registry-details-readonly__status" :class="statusClass(field.value)">{{ field.value }}</span></dd>
                        <dd v-else :class="{ 'registry-details-readonly__description-value': field.label === 'Description' }">{{ field.value }}</dd>
                      </div>
                    </dl>
                  </template>
                </div>

                <div class="registry-overview-block">
                  <div class="registry-overview-block__heading"><span class="registry-overview-heading-icon"><q-icon name="groups" size="19px" /></span><h5>Stakeholders</h5></div>
                  <div v-if="detailStakeholders.length" class="registry-overview-list">
                    <div v-for="(person, index) in detailStakeholders" :key="`${person.user_id}-${index}`" class="registry-overview-list__row">
                      <div class="registry-overview-list__main"><strong>{{ person.stakeholder_type_name || library.labelFor('stakeholderTypes', person.stakeholder_type) || 'Unknown role' }}</strong><span>{{ detailUserName(person.user_id) }}</span></div>
                    </div>
                  </div>
                  <div v-else class="registry-overview-empty">No stakeholders assigned.</div>
                </div>

                <div class="registry-overview-block">
                  <div class="registry-overview-block__heading"><span class="registry-overview-heading-icon"><q-icon name="description" size="19px" /></span><h5>Documents</h5></div>
                  <div v-if="detailDocuments.length" class="registry-overview-list">
                    <div v-for="(doc, index) in detailDocuments" :key="`${doc.docs_type}-${index}`" class="registry-overview-list__row">
                      <div class="registry-overview-list__main"><strong>{{ doc.docs_type_name || library.labelFor('documentTypes', doc.docs_type) || `Document type #${doc.docs_type}` }}</strong><span>{{ documentPathSummary(doc.file_path) }}</span></div>
                    </div>
                  </div>
                  <div v-else class="registry-overview-empty">No document records.</div>
                </div>
              </section>
            </div>
            <div v-show="formStep === 2" class="registry-wizard-content registry-management">
              <section class="registry-management__card" aria-labelledby="registry-management-heading">
                <div class="registry-management__heading">
                  <span class="registry-management__icon"><q-icon name="corporate_fare" size="25px" /></span>
                  <div>
                    <h3 id="registry-management-heading">Management arrangement</h3>
                    <p>Choose who manages the system. Related fields appear automatically.</p>
                  </div>
                </div>
                <div class="registry-management__body">
                  <q-select
                    v-model="form.desc.managing_type"
                    outlined clearable emit-value map-options
                    label="Managing Type"
                    :options="library.managingTypes"
                    option-label="name" option-value="id"
                    class="registry-management__type"
                    @update:model-value="onManagingTypeChanged"
                  >
                  </q-select>

                  <div
                    v-if="showManagingOffice || showThirdPartyCompany"
                    class="registry-management__conditional"
                    :class="{ 'registry-management__conditional--both': showManagingOffice && showThirdPartyCompany }"
                  >
                    <q-select
                      v-if="showManagingOffice"
                      v-model="form.desc.managing_office"
                      outlined clearable emit-value map-options
                      label="Managing Office (Department)"
                      :options="departmentOptions"
                      option-label="name"
                      option-value="id"
                    />
                    <q-input
                      v-if="showThirdPartyCompany"
                      v-model.trim="form.desc.third_party_company"
                      outlined
                      label="Third-Party Company"
                    />
                  </div>
                </div>
              </section>

              <section class="registry-management__card" aria-labelledby="registry-management-schedule">
                <div class="registry-management__heading">
                  <span class="registry-management__icon"><q-icon name="event_note" size="25px" /></span>
                  <div>
                    <h3 id="registry-management-schedule">Project timeline</h3>
                    <p>Track planned delivery dates and project duration.</p>
                  </div>
                </div>
                <div class="registry-management__body registry-management__timeline">
                  <q-input v-model="form.desc.project_roll_on" outlined type="date" label="Project Roll-On" stack-label />
                  <q-input v-model="form.desc.project_sign_off" outlined type="date" label="Project Sign-Off" stack-label />
                  <q-input v-model.number="form.desc.estimation_project_duration" outlined type="number" min="0" label="Estimated Development Duration (days)" class="registry-management__duration" />
                </div>
              </section>
            </div>
            <div v-show="formStep === 3" class="registry-wizard-content registry-documents">
              <p class="text-caption text-grey-7 q-ma-none">{{ managementMode === 'unselected' ? 'Select a Managing Type in the Management tab to enable document actions.' : managementMode === 'third-party' ? 'Upload the document provided by the external company.' : managementMode === 'joint' ? 'Assign a responsible user, upload a document, or prepare a draft.' : 'Assign a responsible user before uploading or preparing a document draft.' }}</p>
              <RegistryDocumentRow
                v-for="(doc, index) in form.docs.slice(0, 4)"
                :key="doc.docs_type"
                :doc="doc"
                :index="index"
                :management-mode="managementMode"
                :document-name="library.labelFor('documentTypes', Number(doc.docs_type))"
                :selected-file-name="documentFiles[String(index)] ?? ''"
                :draft-name="documentDraftNames[String(index)] ?? ''"
                :assignee-name="documentAssignees[String(index)] ? documentAssigneeName(documentAssignees[String(index)]) : ''"
                @upload="triggerDocumentFile"
                @draft="createDocumentDraftName"
                @assign="openDocumentAssignee"
                @remove-assignee="removeDocumentAssignee"
                @view="viewDocumentFile"
                @edit="editDocumentFile"
                @file-selected="onDocumentFileSelected"
              />
            </div>
            <q-dialog v-model="documentDraftDialog">
              <q-card class="registry-document-assign-dialog">
                <q-card-section class="row items-center justify-between">
                  <div>
                    <div class="text-h6">{{ editingDraftName }}</div>
                    <div class="text-caption text-grey-7">Local working draft — not AI-generated or saved to the server.</div>
                  </div>
                  <q-btn flat round icon="close" v-close-popup />
                </q-card-section>
                <q-card-section>
                  <q-input v-model="editingDraftContent" outlined type="textarea" autogrow
                    :readonly="!editingDraftEnabled" label="Draft content" />
                </q-card-section>
                <q-card-actions align="right">
                  <q-btn flat no-caps label="Close" v-close-popup />
                  <q-btn v-if="editingDraftEnabled" unelevated no-caps color="indigo-8"
                    label="Save local draft" @click="saveDocumentDraft" />
                </q-card-actions>
              </q-card>
            </q-dialog>
            <q-dialog v-model="documentPathDialog">
              <q-card class="registry-document-assign-dialog">
                <q-card-section class="row items-center justify-between">
                  <div class="text-h6">Edit document file path</div>
                  <q-btn flat round icon="close" v-close-popup />
                </q-card-section>
                <q-card-section>
                  <q-input v-model.trim="editingDocumentPath" outlined autofocus label="Stored file path or URL" />
                  <div class="text-caption text-grey-7 q-mt-sm">This updates the document path in the Registry form; it does not modify the actual file.</div>
                </q-card-section>
                <q-card-actions align="right">
                  <q-btn flat no-caps label="Cancel" v-close-popup />
                  <q-btn unelevated no-caps color="indigo-8" label="Save path" @click="saveDocumentPath" />
                </q-card-actions>
              </q-card>
            </q-dialog>
            <q-dialog v-model="documentAssigneeDialog">
              <q-card class="registry-document-assign-dialog">
                <q-card-section class="row items-center justify-between">
                  <div><div class="text-h6">Assign document task</div><div class="text-caption text-grey-7">Select a user assigned to the Managing Office.</div></div>
                  <q-btn flat round icon="close" v-close-popup />
                </q-card-section>
                <q-card-section>
                  <q-select v-model="selectedDocumentAssignee" outlined emit-value map-options use-input fill-input hide-selected input-debounce="0" :options="filteredDocumentAssigneeOptions" @filter="filterDocumentAssignees" label="Assigned user" clearable />
                  <div v-if="!documentAssigneeOptions.length" class="text-caption text-negative q-mt-sm">No Managing Office users available. Select an internally managed Managing Type and Managing Office, and confirm that the department has assigned users.</div>
                  <div class="text-caption text-grey-7 q-mt-md">Task assignments are kept locally; the current Registry API does not save document assignees.</div>
                </q-card-section>
                <q-card-actions align="right">
                  <q-btn flat no-caps label="Cancel" v-close-popup />
                  <q-btn unelevated no-caps color="indigo-8" label="Assign task" :disable="selectedDocumentAssignee == null || !documentAssigneeOptions.some(option => option.value === selectedDocumentAssignee)" @click="assignDocumentTask" />
                </q-card-actions>
              </q-card>
            </q-dialog>
            <div v-show="formStep === 4" class="registry-wizard-content registry-stakeholders-layout">
              <section class="registry-stakeholder-workflow" aria-labelledby="registry-assign-stakeholder-title">
                <div class="registry-stakeholders-column__heading">
                  <span class="registry-stakeholders-column__icon"><q-icon name="group_add" size="21px" /></span>
                  <div><h3 id="registry-assign-stakeholder-title">Assign Stakeholders</h3><p>Select users from each available department and assign their roles.</p></div>
                </div>
                <div class="registry-stakeholders-grid">
                    <section v-for="group in stakeholderSections" :key="group.key" class="registry-stakeholder-section">
                      <div class="registry-stakeholder-section__title">
                        <div>
                          <strong>{{ group.title }}</strong>
                          <div class="text-caption text-grey-7">{{ group.departmentId != null ? departmentLabel(group.departmentId) : 'No department selected' }}</div>
                        </div>
                        <q-chip dense color="indigo-1" text-color="indigo-9">{{ group.users.length }} users</q-chip>
                      </div>
                      <div v-if="group.departmentId == null" class="registry-stakeholder-empty">
                        {{ group.key === 'owner' ? 'Select a Business Owner in the System Profile to assign department users.' : 'Select a Managing Office in the Management tab to assign department users.' }}
                      </div>
                      <div v-else-if="departmentUsersLoading && !departmentLoadedIds.includes(group.departmentId)" class="registry-stakeholder-empty row items-center justify-center q-gutter-sm">
                        <q-spinner color="indigo-9" size="20px" /> Loading {{ group.title }} users...
                      </div>
                      <div v-else-if="departmentErrors[group.departmentId]" class="registry-stakeholder-empty">
                        <div class="text-negative q-mb-sm">{{ departmentErrors[group.departmentId] }}</div>
                        <q-btn outline no-caps color="indigo-9" label="Retry loading users" @click="reloadDepartmentUsers" />
                      </div>
                      <div v-else-if="group.users.length === 0" class="registry-stakeholder-empty">
                        No users are available in this {{ group.title }} department.
                        <div class="q-mt-sm"><q-btn flat no-caps color="indigo-9" icon="refresh" label="Reload users" @click="reloadDepartmentUsers" /></div>
                      </div>
                      <div v-else class="registry-assign-panel">
                        <div class="registry-assign-controls">
                          <q-select v-model="sectionRoles[group.key]" outlined dense clearable emit-value map-options
                            label="Stakeholder type *" :options="library.stakeholderTypes"
                            option-label="name" option-value="id" class="registry-assign-type" />
                          <q-btn unelevated no-caps color="indigo-9" icon="group_add"
                            :disable="sectionSelections[group.key].length === 0 || sectionRoles[group.key] == null || saving"
                            :label="`Assign ${sectionSelections[group.key].length}`"
                            @click="assignSectionStakeholders(group.key)" />
                        </div>
                        <div class="registry-department-group__header">
                          <span>{{ group.users.length }} available users</span>
                          <q-checkbox :model-value="allSectionUsersSelected(group.key, group.users)"
                            color="indigo-9" label="Select all" @update:model-value="checked => selectSectionUsers(group.key, group.users, checked)" />
                        </div>
                        <div class="registry-stakeholder-list">
                          <div v-for="user in group.users" :key="user.id" class="registry-stakeholder-item">
                            <q-checkbox :model-value="sectionSelections[group.key].includes(user.id)" color="indigo-9"
                              @update:model-value="checked => selectSectionUser(group.key, user.id, checked)" />
                            <q-avatar color="indigo-1" text-color="indigo-9" size="35px">{{ userInitials(user.name) }}</q-avatar>
                            <div class="registry-stakeholder-person"><strong>{{ user.name }}</strong><span>{{ user.email || 'No email provided' }}</span></div>
                            <q-chip v-if="isStakeholderSelected(user.id)" dense outline color="indigo-8" icon="check_circle">
                              {{ library.labelFor('stakeholderTypes', stakeholderTypeFor(user.id)) }}
                            </q-chip>
                          </div>
                        </div>
                      </div>
                    </section>


                </div>
              </section>
              <section class="registry-stakeholder-workflow" aria-labelledby="registry-assigned-stakeholder-title">
                <div class="registry-stakeholders-column__heading">
                  <span class="registry-stakeholders-column__icon"><q-icon name="groups" size="21px" /></span>
                  <div><h3 id="registry-assigned-stakeholder-title">Assigned Groups</h3><p>Stakeholders grouped by department and role.</p></div>
                </div>
                <div class="registry-stakeholders-grid">
                  <section v-for="section in assignedStakeholderSections" :key="section.key" class="registry-assigned-department">
                    <div class="registry-stakeholder-section__title">
                      <div>
                        <strong>{{ section.title }}</strong>
                        <div class="text-caption text-grey-7">{{ section.departmentId != null ? departmentLabel(section.departmentId) : 'No department selected' }}</div>
                      </div>
                      <q-chip dense color="indigo-1" text-color="indigo-9">{{ section.users.length }} assigned</q-chip>
                    </div>
                    <div v-if="section.groups.length" class="registry-assigned-groups">
                      <section v-for="group in section.groups" :key="group.id" class="registry-assigned-group">
                        <div class="registry-assigned-group__header"><strong>{{ group.name }}</strong><q-chip dense color="indigo-1" text-color="indigo-9">{{ group.users.length }} user(s)</q-chip></div>
                        <div v-for="user in group.users" :key="user.user_id" class="registry-assigned-user">
                          <q-icon name="person" color="indigo-8" size="19px" />
                          <span>{{ userDisplayName(user.user_id) }}</span>
                          <q-btn round dense flat icon="close" color="negative" aria-label="Remove assignment" @click="removeStakeholder(user.user_id)" />
                        </div>
                      </section>
                    </div>
                    <div v-else class="registry-stakeholder-empty">No stakeholders assigned to this department.</div>
                  </section>
                </div>
                <section v-if="unclassifiedStakeholderGroups.length" class="registry-assigned-unclassified">
                  <div class="registry-stakeholder-section__title"><div><strong>Other Assigned Users</strong><div class="text-caption text-grey-7">Department membership could not be verified from the loaded directory.</div></div></div>
                  <div class="registry-assigned-groups">
                    <section v-for="group in unclassifiedStakeholderGroups" :key="group.id" class="registry-assigned-group">
                      <div class="registry-assigned-group__header"><strong>{{ group.name }}</strong></div>
                      <div v-for="user in group.users" :key="user.user_id" class="registry-assigned-user">
                        <q-icon name="person" color="indigo-8" size="19px" />
                        <span>{{ userDisplayName(user.user_id) }}</span>
                        <q-btn round dense flat icon="close" color="negative" aria-label="Remove assignment" @click="removeStakeholder(user.user_id)" />
                      </div>
                    </section>
                  </div>
                </section>
              </section>
              <div v-if="library.stakeholderTypes.length === 0" class="text-caption text-orange-9">Stakeholder types are unavailable. Reload the Stakeholder Type Library.</div>
            </div>
            <div v-show="formStep === 5" class="registry-wizard-content registry-technology">
              <div class="registry-technology__intro">
                <span class="registry-technology__intro-icon"><q-icon name="developer_board" size="24px" /></span>
                <div>
                  <h3>Technology Configuration</h3>
                  <p>Define the technologies and infrastructure used to build and run this information system.</p>
                </div>
              </div>

              <div class="registry-technology__stack-grid">
                <section class="registry-technology__card" aria-labelledby="registry-technology-frontend-title">
                  <div class="registry-technology__card-header">
                    <span class="registry-technology__card-icon registry-technology__card-icon--frontend"><q-icon name="desktop_windows" size="22px" /></span>
                    <div>
                      <h4 id="registry-technology-frontend-title">Frontend Stack</h4>
                      <p>Client-side frameworks and UI technologies</p>
                    </div>
                  </div>
                  <q-select
                    v-model="form.tech_stack.frontend_stack"
                    multiple use-chips outlined clearable
                    label="Frontend technologies"
                    :options="library.techStacks"
                    :option-label="techLabel"
                    option-value="id" emit-value map-options
                    dropdown-icon="expand_more"
                    class="registry-technology__field"
                  />
                  <div class="registry-technology__helper"><q-icon name="info_outline" size="15px" /> Select one or more technologies</div>
                </section>

                <section class="registry-technology__card" aria-labelledby="registry-technology-backend-title">
                  <div class="registry-technology__card-header">
                    <span class="registry-technology__card-icon registry-technology__card-icon--backend"><q-icon name="dns" size="22px" /></span>
                    <div>
                      <h4 id="registry-technology-backend-title">Backend Stack</h4>
                      <p>Server-side languages, frameworks and APIs</p>
                    </div>
                  </div>
                  <q-select
                    v-model="form.tech_stack.backend_stack"
                    multiple use-chips outlined clearable
                    label="Backend technologies"
                    :options="library.techStacks"
                    :option-label="techLabel"
                    option-value="id" emit-value map-options
                    dropdown-icon="expand_more"
                    class="registry-technology__field"
                  />
                  <div class="registry-technology__helper"><q-icon name="info_outline" size="15px" /> Select one or more technologies</div>
                </section>
              </div>

              <section class="registry-technology__card registry-technology__infrastructure" aria-labelledby="registry-technology-infra-title">
                <div class="registry-technology__card-header">
                  <span class="registry-technology__card-icon registry-technology__card-icon--infra"><q-icon name="storage" size="22px" /></span>
                  <div>
                    <h4 id="registry-technology-infra-title">Database &amp; Infrastructure</h4>
                    <p>Configure where your system data and services are hosted.</p>
                  </div>
                </div>
                <div class="registry-technology__infra-grid">
                  <q-input v-model.trim="form.tech_stack.database" outlined label="Database" placeholder="e.g. MySQL, PostgreSQL" class="registry-technology__field">
                    <template #prepend><q-icon name="database" size="19px" /></template>
                  </q-input>
                  <q-input v-model.trim="form.tech_stack.server_type" outlined label="Server type" placeholder="e.g. Cloud, On-premises" class="registry-technology__field">
                    <template #prepend><q-icon name="cloud_queue" size="19px" /></template>
                  </q-input>
                  <q-input v-model.trim="form.tech_stack.server_name" outlined label="Server name" placeholder="e.g. Application Server 01" class="registry-technology__field registry-technology__server-name">
                    <template #prepend><q-icon name="computer" size="19px" /></template>
                  </q-input>
                </div>
              </section>
            </div>
            <div v-show="formStep === 6" class="registry-wizard-content">

            <div v-if="isFullstackSolution" class="registry-repository-pair">
              <section v-for="scope in repositoryScopes" :key="scope" class="registry-repository-section registry-repository-card">
                <div class="registry-repository-section__header">
                  <q-icon :name="scope === 'frontend' ? 'desktop_windows' : 'dns'" size="23px" />
                  <div><h3>{{ scope === 'frontend' ? 'Frontend Repository' : 'Backend Repository' }}</h3><p>Git source and environment URLs</p></div>
                </div>
                <div class="registry-repository-fields">
                  <q-input v-model.trim="form.repo[`${scope}_repo_git`]" outlined label="Git Repository URL" type="url" />
                  <q-input v-model.trim="form.repo[`${scope}_staging_url`]" outlined label="Staging URL" type="url" />
                  <q-input v-model.trim="form.repo[`${scope}_production_url`]" outlined label="Production URL" type="url" />
                </div>
              </section>
            </div>
            <section v-else class="registry-repository-section registry-repository-card">
              <div class="registry-repository-section__header"><q-icon name="source" size="23px" /><div><h3>Repository and Deployment URLs</h3><p>One repository for this development solution.</p></div></div>
              <div class="registry-repository-fields">
                <q-input v-model.trim="form.repo.repo_git" outlined label="Git Repository URL" type="url" />
                <q-input v-model.trim="form.repo.staging_url" outlined label="Staging URL" type="url" />
                <q-input v-model.trim="form.repo.production_url" outlined label="Production URL" type="url" />
              </div>
            </section>

            </div>
            </q-card-section>
          </div>
          <q-separator />
          <q-card-actions align="right" class="registry-wizard-footer q-pa-md">
            <q-btn flat no-caps label="Cancel" :disable="saving" @click="formOpen = false" />
            <div class="q-mr-auto"></div>
            <q-btn v-if="formStep > 1" flat no-caps icon="arrow_back" label="Back" :disable="saving" @click="formStep--" />
            <q-btn v-if="formStep < stepLabels.length" unelevated no-caps color="indigo-9" icon-right="arrow_forward" label="Next" :disable="saving" @click="nextStep" />
            <q-btn unelevated no-caps type="submit" color="primary" icon="save" label="Save Changes" :loading="saving" :disable="saving" aria-label="Save registry changes and close modal" />
            <q-btn v-if="formStep === stepLabels.length" unelevated no-caps type="button" color="indigo-9" icon-right="play_arrow" label="Execute" :disable="saving" aria-label="Review task generation acknowledgement" @click="requestScrumExecution" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- Confirm the implications of Execute before opening the frontend-only planning preview. -->
    <q-dialog v-model="scrumAcknowledgementOpen" persistent transition-show="scale" transition-hide="scale">
      <q-card class="registry-execution-confirm">
        <header class="registry-execution-confirm__header">
          <div class="registry-execution-confirm__icon"><q-icon name="auto_awesome" size="28px" /></div>
          <div class="registry-execution-confirm__heading">
            <span class="registry-execution-confirm__eyebrow">ONE ICTMS · PROJECT EXECUTION</span>
            <h2>Confirm AI Task Generation</h2>
            <p>Review and acknowledge the next step before entering Scrum Planning.</p>
          </div>
          <q-btn flat round dense icon="close" color="white" aria-label="Cancel execution" @click="cancelScrumExecution" />
        </header>
        <q-card-section class="registry-execution-confirm__body">
          <div class="registry-execution-confirm__intro">
            <q-icon name="info_outline" size="21px" />
            <p>By proceeding, you acknowledge that the execution workflow is intended to generate suggested development tasks based on the following project documents. The Project Manager or Scrum Master must evaluate the tasks before scheduling them into sprints.</p>
          </div>
          <div class="registry-execution-confirm__section-title">Source documents for task generation</div>
          <div class="registry-execution-confirm__docs">
            <div v-for="doc in scrumAcknowledgementDocuments" :key="doc.code" class="registry-execution-confirm__doc">
              <div class="registry-execution-confirm__doc-icon"><q-icon :name="doc.icon" size="21px" /></div>
              <div><strong>{{ doc.name }}</strong><span>{{ doc.code }}</span></div>
              <q-icon name="description" class="registry-execution-confirm__doc-mark" size="19px" />
            </div>
          </div>
          <div class="registry-execution-confirm__preview-note">
            <q-icon name="science" size="19px" />
            <span><strong>Frontend preview:</strong> The next screen currently uses sample tasks. No AI request is sent, and no tasks or sprint plans are saved.</span>
          </div>
          <q-checkbox v-model="scrumExecutionAcknowledged" color="indigo-9" class="registry-execution-confirm__checkbox"
            label="I understand that suggested tasks require Project Manager or Scrum Master review before sprint planning." />
        </q-card-section>
        <q-separator />
        <q-card-actions align="right" class="registry-execution-confirm__footer">
          <q-btn flat no-caps color="grey-8" label="Cancel" @click="cancelScrumExecution" />
          <q-btn unelevated no-caps color="indigo-9" icon-right="arrow_forward" label="Acknowledge & Continue"
            :disable="!scrumExecutionAcknowledged" @click="confirmScrumExecution" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- FRONTEND-ONLY PREVIEW: AI tasks and sprint planning are local UI examples, not persisted. -->
    <q-dialog v-model="scrumPlanningOpen" persistent maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card class="scrum-planner">
        <header class="scrum-planner__header">
          <div class="scrum-planner__identity">
            <div class="scrum-planner__mark"><q-icon name="auto_awesome" size="26px" /></div>
            <div>
              <div class="scrum-planner__eyebrow">ONE ICTMS <span> / </span> PROJECT DELIVERY</div>
              <h2>Scrum Planning</h2>
              <p>Review document-aligned tasks and organize approved work into sprints.</p>
            </div>
          </div>
          <div class="scrum-planner__header-actions">
            <q-badge class="scrum-planner__preview-badge">UI PREVIEW · NO TASKS SAVED</q-badge>
            <q-btn flat round icon="close" color="white" aria-label="Close Scrum planning" @click="scrumPlanningOpen = false" />
          </div>
        </header>

        <div class="scrum-planner__overview">
          <div class="scrum-planner__project">
            <span class="scrum-planner__project-icon"><q-icon name="dns" size="24px" /></span>
            <div><small>ACTIVE SYSTEM</small><strong>{{ form.system_name || 'Unnamed System' }}</strong><span>{{ form.alias || 'Information System' }}</span></div>
          </div>
          <div class="scrum-planner__metric"><q-icon name="task_alt" /><div><strong>{{ scrumTasks.length }}</strong><span>Development tasks</span></div></div>
          <div class="scrum-planner__metric"><q-icon name="fact_check" /><div><strong>{{ reviewedScrumTasks }}</strong><span>Evaluated</span></div></div>
          <div class="scrum-planner__metric"><q-icon name="view_kanban" /><div><strong>{{ scheduledScrumTasks }}</strong><span>In sprint plan</span></div></div>
          <div class="scrum-planner__metric"><q-icon name="description" /><div><strong>4</strong><span>Source document types</span></div></div>
        </div>

        <div class="scrum-planner__notice">
          <q-icon name="info_outline" size="19px" />
          <span><strong>Frontend preview.</strong> Proposed development tasks mapped to Public User stories and acceptance criteria from the Phase 1 LGBTQIA+ workbook. These are not generated from uploaded documents; review and sprint changes are not saved.</span>
        </div>

        <div class="scrum-planner__workspace">
          <section class="scrum-planner__column scrum-planner__column--sprint" aria-labelledby="scrum-sprint-title">
            <div class="scrum-planner__column-head">
              <div class="scrum-planner__column-title"><span class="scrum-planner__column-icon scrum-planner__column-icon--sprint"><q-icon name="view_kanban" size="22px" /></span>
                <div><h3 id="scrum-sprint-title">Sprint Plan</h3><p>Project Manager / Scrum Master workspace</p></div>
              </div>
              <q-btn round flat dense icon="add" color="indigo-9" aria-label="Add sprint" @click="addScrumSprint"><q-tooltip>Add sprint</q-tooltip></q-btn>
            </div>
            <div class="scrum-planner__sprint-tabs" role="group" aria-label="Available sprints">
              <button v-for="sprint in scrumSprints" :key="sprint.id" type="button" class="scrum-planner__sprint-tab"
                :class="{ 'is-selected': activeSprintId === sprint.id }" @click="activeSprintId = sprint.id">{{ sprint.name }} <span>{{ countScrumSprintTasks(sprint.id) }}</span></button>
            </div>
            <div class="scrum-planner__sprint-summary">
              <div><span>SELECTED SPRINT</span><strong>{{ activeScrumSprintName }}</strong></div>
              <div><span>ESTIMATED EFFORT</span><strong>{{ activeScrumSprintPoints }} story points</strong></div>
            </div>
            <div class="scrum-planner__dropzone" :class="{ 'is-over': scrumDropOver }" @dragover.prevent="scrumDropOver = true" @dragleave="scrumDropOver = false" @drop.prevent="onScrumDropToSprint">
              <div v-if="activeScrumSprintTasks.length === 0" class="scrum-planner__drop-hint">
                <span class="scrum-planner__drop-icon"><q-icon name="move_to_inbox" size="35px" /></span>
                <strong>Build your sprint backlog</strong><p>Approve eligible tasks first, then drag them here or select <b>Plan</b>.</p>
                <span>Review decisions stay visible on each task.</span>
              </div>
              <article v-for="task in activeScrumSprintTasks" :key="task.id" class="scrum-planner__planned-task" draggable="true"
                @dragstart="onScrumDragStart($event, task.id)" @dragend="scrumDraggingId = null">
                <div class="scrum-planner__task-meta"><span class="scrum-planner__category" :class="`scrum-planner__category--${task.category.toLowerCase().replace('/', '-')}`">{{ task.category }}</span><q-icon name="drag_indicator" class="scrum-planner__drag-handle" /></div>
                <h4>{{ task.title }}</h4>
                <div class="scrum-planner__planned-context">{{ task.category }} · {{ task.module }} · {{ task.userStory }}</div>
                <div class="scrum-planner__planned-context">Dependencies: {{ task.dependencies.length ? task.dependencies.join(', ') : 'None' }}</div>
                <div class="scrum-planner__planned-bottom"><span>{{ task.points }} pts · {{ task.priority }} priority</span><span class="scrum-planner__review-state" :class="`is-${task.review}`">{{ scrumReviewLabel(task.review) }}</span></div>
                <div class="scrum-planner__planned-actions">
                  <q-btn flat dense no-caps icon="check_circle_outline" label="Approve" color="positive" :disable="task.review === 'approved'" @click="task.review = 'approved'" />
                  <q-btn flat dense no-caps icon="undo" label="Backlog" color="indigo-9" @click="moveScrumTask(task.id, null)" />
                </div>
              </article>
            </div>
            <div class="scrum-planner__sprint-footer"><q-icon name="verified_user" size="18px" /><span>Project Manager / Scrum Master review required before sprint execution.</span></div>
          </section>

          <section class="scrum-planner__column scrum-planner__column--suggestions" aria-labelledby="scrum-suggestions-title">
            <div class="scrum-planner__column-head">
              <div class="scrum-planner__column-title">
                <span class="scrum-planner__column-icon scrum-planner__column-icon--ai"><q-icon name="auto_awesome" size="22px" /></span>
                <div><h3 id="scrum-suggestions-title">Task Suggestions</h3><p>Development backlog · approve before planning</p></div>
              </div>
              <q-badge class="scrum-planner__count">{{ unscheduledScrumTasks }} unplanned</q-badge>
            </div>
            <div class="scrum-planner__view-tabs" role="tablist" aria-label="Task connections">
              <button type="button" role="tab" :aria-selected="scrumTaskView === 'categories'" class="scrum-planner__view-tab"
                :class="{ 'is-selected': scrumTaskView === 'categories' }" @click="scrumTaskView = 'categories'">
                <q-icon name="category" size="16px" /> Task List
              </button>
              <button type="button" role="tab" :aria-selected="scrumTaskView === 'traceability'" class="scrum-planner__view-tab"
                :class="{ 'is-selected': scrumTaskView === 'traceability' }" @click="scrumTaskView = 'traceability'">
                <q-icon name="account_tree" size="16px" /> Traceability View
              </button>
            </div>
            <div v-if="scrumTaskView === 'categories'" class="scrum-planner__filters" role="group" aria-label="Filter tasks by development category">
              <button v-for="category in scrumCategoryFilters" :key="category" type="button" class="scrum-planner__filter"
                :class="{ 'is-selected': scrumCategoryFilter === category }" @click="scrumCategoryFilter = category">{{ category }}</button>
            </div>
            <div v-else class="scrum-planner__connection-panel">
              <div class="scrum-planner__connection-label">User Stories</div>
              <div class="scrum-planner__connection-tabs" role="tablist" aria-label="Select user story">
                <button v-for="story in scrumUserStories" :key="story" type="button" role="tab"
                  :aria-selected="selectedScrumStory === story" class="scrum-planner__filter"
                  :class="{ 'is-selected': selectedScrumStory === story }" @click="selectScrumStory(story)">
                  {{ story.split(':')[0] }} <span class="scrum-planner__connection-count">{{ scrumTasks.filter(task => task.userStory === story).length }}</span>
                </button>
              </div>
              <div v-if="selectedScrumStory" class="scrum-planner__connection-story"><q-icon name="menu_book" size="17px" /> {{ selectedScrumStory }}</div>
              <div class="scrum-planner__connection-caption">Expand an acceptance criterion to see every generated task linked to its module, including tasks already assigned to sprints.</div>
            </div>
            <div v-if="scrumTaskView === 'categories'" class="scrum-planner__task-list" @dragover.prevent @drop="onScrumDropToBacklog">
              <section v-for="group in visibleScrumTaskGroups" :key="group.key" class="scrum-planner__module-group">
                <article v-for="task in group.tasks" :key="task.id" class="scrum-planner__task"
                draggable="true" @dragstart="onScrumDragStart($event, task.id)" @dragend="scrumDraggingId = null"
                :class="{ 'is-dragging': scrumDraggingId === task.id }">
                <div class="scrum-planner__task-meta">
                  
                  <span class="scrum-planner__category" :class="`scrum-planner__category--${task.category.toLowerCase().replace('/', '-')}`">{{ task.category }}</span>
                  <q-icon name="drag_indicator" class="scrum-planner__drag-handle" aria-label="Drag task" />
                </div>
                <h4>{{ task.title }}</h4>
                <div class="scrum-planner__trace">
                  <div><b>User Story</b><span>{{ task.userStory }}</span></div>
                  <div><b>Acceptance Criteria</b><span>{{ task.acceptanceCriteria }}</span></div>
                  <div><b>Module</b><span>{{ task.module }}</span></div>
                  <div><b>Task</b><span>{{ task.title }}</span></div>
                  <div><b>Task Details</b><span>{{ task.description }}</span></div>
                  <div><b>Task Dependencies</b><span>{{ task.dependencies.length ? task.dependencies.join(', ') : 'None' }}</span></div>
                  <div><b>Source Document</b><span>{{ task.source }}</span></div>
                </div>
                <div class="scrum-planner__task-bottom">
                  <div class="scrum-planner__tags"><span><q-icon name="schedule" size="14px" /> {{ task.points }} pts</span><span>{{ task.priority }} priority</span></div>
                  <span class="scrum-planner__review-state" :class="`is-${task.review}`">{{ scrumReviewLabel(task.review) }}</span>
                </div>
                <div class="scrum-planner__review-actions">
                  <q-btn flat dense no-caps icon="check_circle_outline" label="Approve" color="positive" :disable="task.review === 'approved'" @click="task.review = 'approved'" />
                  <q-btn flat dense no-caps icon="rate_review" label="Needs revision" color="orange-9" :disable="task.review === 'revision'" @click="task.review = 'revision'" />
                  <q-btn v-if="task.sprintId === null" flat dense no-caps icon="add_circle_outline" label="Plan" color="indigo-9" :disable="!canPlanScrumTask(task)" @click="moveScrumTask(task.id, activeSprintId)" />
                  <q-btn v-else flat dense no-caps icon="undo" label="Return to Backlog" color="indigo-9" @click="moveScrumTask(task.id, null)" />
                </div>
                </article>
              </section>
              <div v-if="visibleScrumSuggestions.length === 0" class="scrum-planner__empty"><q-icon name="inventory_2" size="32px" /><strong>No matching tasks</strong><span>Choose another category, user story, or acceptance criterion.</span></div>
            </div>
            <div v-else class="scrum-planner__task-list scrum-planner__trace-accordion" @dragover.prevent @drop="onScrumDropToBacklog">
              <q-expansion-item v-for="(criterion, index) in scrumStoryCriteria" :key="`${selectedScrumStory}-${criterion}`"
                expand-separator dense-toggle class="scrum-planner__criterion-item" header-class="scrum-planner__criterion-header"
                :default-opened="index === 0">
                <template #header>
                  <q-item-section avatar><q-icon name="fact_check" color="indigo-8" size="20px" /></q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-medium">AC-{{ String(index + 1).padStart(2, '0') }} · {{ criterion }}</q-item-label>
                    <q-item-label caption>{{ scrumTasks.filter(task => task.userStory === selectedScrumStory && task.acceptanceCriteria === criterion).length }} tasks generated</q-item-label>
                  </q-item-section>
                </template>
                <div class="scrum-planner__criterion-body">
                  <section v-for="group in scrumGroupsForCriterion(criterion)" :key="group.module" class="scrum-planner__module-group">
                    <div class="scrum-planner__module-heading">
                      <div class="scrum-planner__module-title"><q-icon name="layers" size="18px" /><strong>Module: {{ group.module }}</strong><span>{{ group.tasks.length }} tasks</span></div>
                      <div class="scrum-planner__generated-heading"><q-icon name="list_alt" size="16px" /> Generated Tasks ({{ group.tasks.length }})</div>
                    </div>
                    <article v-for="task in group.tasks" :key="task.id" class="scrum-planner__trace-task-row"
                      draggable="true" @dragstart="onScrumDragStart($event, task.id)" @dragend="scrumDraggingId = null">
                      <button type="button" class="scrum-planner__trace-task-toggle"
                        :aria-expanded="expandedScrumTaskId === task.id"
                        :aria-controls="`scrum-task-detail-${task.id}`"
                        @click="expandedScrumTaskId = expandedScrumTaskId === task.id ? null : task.id">
                        <span class="scrum-planner__trace-task-code">{{ task.id }}</span>
                        <span class="scrum-planner__trace-task-name">{{ task.title }}</span>
                        <span class="scrum-planner__category" :class="`scrum-planner__category--${task.category.toLowerCase().replace('/', '-')}`">{{ task.category }}</span>
                        <q-icon :name="expandedScrumTaskId === task.id ? 'expand_less' : 'expand_more'" size="18px" class="scrum-planner__trace-task-chevron" />
                      </button>
                      <div class="scrum-planner__trace-task-subtitle">
                        <span>{{ task.sprintId !== null ? (scrumSprints.find(sprint => sprint.id === task.sprintId)?.name || 'Assigned to sprint') : 'Unplanned backlog' }}</span>
                        <span>·</span>
                        <span>{{ scrumReviewLabel(task.review) }}</span>
                      </div>
                      <div v-if="expandedScrumTaskId === task.id" :id="`scrum-task-detail-${task.id}`" class="scrum-planner__trace-task-details">
                        <div class="scrum-planner__trace">
                          <div><b>Task Code</b><span>{{ task.id }}</span></div>
                          <div><b>Task Details</b><span>{{ task.description }}</span></div>
                          <div><b>Dependencies</b><span>{{ task.dependencies.length ? task.dependencies.map(id => `${id}: ${scrumTasks.find(item => item.id === id)?.title || 'Unknown task'}`).join(', ') : 'None' }}</span></div>
                          <div><b>Source Document</b><span>{{ task.source }}</span></div>
                        </div>
                        <div class="scrum-planner__task-bottom">
                          <div class="scrum-planner__tags"><span><q-icon name="schedule" size="14px" /> {{ task.points }} pts</span><span>{{ task.priority }} priority</span></div>
                          <span class="scrum-planner__review-state" :class="`is-${task.review}`">{{ scrumReviewLabel(task.review) }}</span>
                        </div>
                        <div class="scrum-planner__review-actions">
                          <q-btn flat dense no-caps icon="check_circle_outline" label="Approve" color="positive" :disable="task.review === 'approved'" @click="task.review = 'approved'" />
                          <q-btn flat dense no-caps icon="rate_review" label="Needs revision" color="orange-9" :disable="task.review === 'revision'" @click="task.review = 'revision'" />
                          <q-btn v-if="task.sprintId === null" flat dense no-caps icon="add_circle_outline" label="Plan" color="indigo-9" :disable="!canPlanScrumTask(task)" @click="moveScrumTask(task.id, activeSprintId)" />
                          <q-btn v-else flat dense no-caps icon="undo" label="Return to Backlog" color="indigo-9" @click="moveScrumTask(task.id, null)" />
                        </div>
                      </div>
                    </article>
                  </section>
                </div>
              </q-expansion-item>
              <div v-if="scrumStoryCriteria.length === 0" class="scrum-planner__empty">No generated tasks linked to this story.</div>
            </div>
          </section>
        </div>
        <footer class="scrum-planner__footer">
          <span><q-icon name="cloud_off" size="17px" /> Demo planning session · Changes are not saved</span>
          <div><q-btn flat no-caps color="indigo-9" label="Close Preview" @click="scrumPlanningOpen = false" />
            <q-btn unelevated no-caps color="indigo-9" icon="task_alt" label="Planning Preview Only" disable /></div>
        </footer>
      </q-card>
    </q-dialog>

    <q-dialog v-model="viewOpen"><q-card class="registry-dialog registry-dialog--wide">
      <q-card-section class="row items-center justify-between"><div class="text-h6 text-weight-bold">System Profile</div><q-btn flat round icon="close" v-close-popup /></q-card-section>
      <q-separator />
      <q-card-section v-if="selected" class="registry-details registry-form--scroll">
        <h3>{{ selected.system_name }}</h3><p>{{ selected.description || 'No description provided.' }}</p>
        <dl>
          <dt>Alias</dt><dd>{{ selected.alias || '—' }}</dd>
          <dt>Status</dt><dd>{{ statusLabel(selected.status) }}</dd>
          <dt>Business owner</dt><dd>{{ departmentLabel(selected.business_owner) }}</dd>
          <dt>Managing type</dt><dd>{{ library.labelFor('managingTypes', selected.desc?.managing_type) }}</dd>
          <dt>Managing office</dt><dd>{{ departmentLabel(selected.desc?.managing_office) }}</dd>
          <dt>Third party</dt><dd>{{ selected.desc?.third_party_company || '—' }}</dd>
          <dt>Roll-on</dt><dd>{{ selected.desc?.project_roll_on || '—' }}</dd>
          <dt>Sign-off</dt><dd>{{ selected.desc?.project_sign_off || '—' }}</dd>
          <dt>Duration</dt><dd>{{ selected.desc?.estimation_project_duration ?? '—' }}</dd>
          <dt>Solution type</dt><dd>{{ library.labelFor('developmentSolutionTypes', selected.repo?.development_solution_type) }}</dd>
          <dt>Git repo</dt><dd>{{ selected.repo?.repo_git || '—' }}</dd>
          <dt>Staging</dt><dd>{{ selected.repo?.staging_url || '—' }}</dd>
          <dt>Production</dt><dd>{{ selected.repo?.production_url || '—' }}</dd>
          <dt>Frontend</dt><dd>{{ stackNames(selected.tech_stack?.frontend_stack) }}</dd>
          <dt>Backend</dt><dd>{{ stackNames(selected.tech_stack?.backend_stack) }}</dd>
          <dt>Database</dt><dd>{{ selected.tech_stack?.database || '—' }}</dd>
          <dt>Server</dt><dd>{{ [selected.tech_stack?.server_type, selected.tech_stack?.server_name].filter(Boolean).join(' / ') || '—' }}</dd>
          <dt>Stakeholders</dt><dd>{{ stakeholderNames(selected.stakeholders) }}</dd>
          <dt>Documents</dt><dd>{{ documentNames(selected.docs) }}</dd>
          <dt>Updated</dt><dd>{{ formatDate(selected.updated_at) }}</dd>
        </dl>
      </q-card-section>
      <q-card-actions align="right"><q-btn flat no-caps label="Close" v-close-popup /></q-card-actions>
    </q-card></q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import RegistryDocumentRow from '@/components/registry/RegistryDocumentRow.vue'
import { useQuasar, type QTableColumn } from 'quasar'
import { registryApi } from '@/services/registry-api'
import { useLibraryStore } from '@/stores/library'
import { useAuthStore } from '@/stores/auth'
import { errorMessage } from '@/services/http'
import { libraryApi, type DepartmentUser, type LibraryOption } from '@/services/library-api'
import type { RegistryPayload, RegistryRecord } from '@/types/registry'

type RegistryRepositoryForm = NonNullable<RegistryPayload['repo']> & {
  frontend_repo_git?: string | null
  frontend_staging_url?: string | null
  frontend_production_url?: string | null
  backend_repo_git?: string | null
  backend_staging_url?: string | null
  backend_production_url?: string | null
}

type RegistryForm = Omit<RegistryPayload, 'status' | 'desc' | 'repo' | 'tech_stack' | 'stakeholders' | 'docs'> & {
  status: number | null
  desc: NonNullable<RegistryPayload['desc']>
  repo: RegistryRepositoryForm
  tech_stack: NonNullable<RegistryPayload['tech_stack']>
  stakeholders: NonNullable<RegistryPayload['stakeholders']>
  docs: NonNullable<RegistryPayload['docs']>
}

const $q = useQuasar()
const library = useLibraryStore()
const auth = useAuthStore()
const systems = ref<RegistryRecord[]>([])
const selected = ref<RegistryRecord | null>(null)
// The view endpoint includes relation labels and row metadata in addition to the editable payload.
// Keep a snapshot of that response for the read-only Details tab.
type RegistryScopedRepo = {
  repo_scope: string
  repo_git?: string | null
  staging_url?: string | null
  production_url?: string | null
  development_solution_type?: number | null
}
type RegistryApiWithRepos = RegistryRecord & { repos?: RegistryScopedRepo[] }

type DetailsApiRecord = {
  id?: number
  business_owner_department?: { id?: number; alias?: string; name?: string } | null
  status_name?: string | null
  desc?: { managing_type_name?: string | null; managing_office_department?: { id?: number; alias?: string; name?: string } | null; id?: number; registry_id?: number } | null
  repo?: { development_solution_type_name?: string | null; id?: number; registry_id?: number; created_at?: string; updated_at?: string } | null
  repos?: RegistryScopedRepo[]
  tech_stack?: { id?: number; registry_id?: number; created_at?: string; updated_at?: string } | null
  stakeholders?: Array<{ id?: number; registry_id?: number; user_id: number; stakeholder_type: number; stakeholder_type_name?: string; created_at?: string; updated_at?: string }>
  docs?: Array<{ id?: number; registry_id?: number; docs_type: number; docs_type_name?: string; file_path: string; created_at?: string; updated_at?: string }>
  created_at?: string
  updated_at?: string
}
type OverviewField = { label: string; value: string; wide?: boolean; status?: boolean; prominent?: boolean }
const detailsApiRecord = ref<DetailsApiRecord | null>(null)
// The API includes relation metadata, while editable form rows only contain payload fields.
// Use a common display type so both sources are safe in the Details template.
type DetailStakeholder = NonNullable<DetailsApiRecord['stakeholders']>[number]
type DetailDocument = NonNullable<DetailsApiRecord['docs']>[number]
function dash(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string') return value.trim() || '—'
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return String(value)
  return '—'
}
const detailStakeholders = computed<DetailStakeholder[]>(() =>
  detailsApiRecord.value?.stakeholders?.length
    ? detailsApiRecord.value.stakeholders
    : form.value.stakeholders.map(person => ({ ...person })),
)
const detailDocuments = computed<DetailDocument[]>(() =>
  detailsApiRecord.value?.docs?.length
    ? detailsApiRecord.value.docs
    : form.value.docs.map(doc => ({ ...doc })),
)
function detailUserName(id: number): string {
  if (Number(auth.user?.id) === Number(id)) return loggedInUserName.value
  return departmentUsers.value.find(user => Number(user.id) === Number(id))?.name ?? `User #${id}`
}
function documentPathSummary(path?: string | null): string {
  if (!path) return 'Not uploaded'
  if (path.startsWith(PENDING_DOC_PREFIX)) return 'Pending document — not uploaded'
  if (path.startsWith(PENDING_UPLOAD_PREFIX)) return 'File selected locally — upload not completed'
  if (path.startsWith(PENDING_DRAFT_PREFIX)) return 'Draft placeholder — content not stored'
  return path
}
const registryOverviewSections = computed<{ title: string; icon: string; fields: OverviewField[] }[]>(() => {
  const snapshot = detailsApiRecord.value
  const description = form.value.desc
  const tech = form.value.tech_stack
  const repo = form.value.repo
  const dept = snapshot?.business_owner_department
  const office = snapshot?.desc?.managing_office_department
  return [
    { title: 'System Profile', icon: 'dns', fields: [
      { label: 'System Name', value: `${dash(form.value.system_name)}${form.value.alias?.trim() ? ` (${form.value.alias.trim()})` : ''}`, prominent: true, wide: true },
      { label: 'Registry Status', value: snapshot?.status_name || (form.value.status == null ? '—' : statusLabel(form.value.status)), status: true },
      { label: 'Business Owner', value: dept ? `${dept.name || dept.alias || 'Department'}${dept.alias && dept.name ? ` (${dept.alias})` : ''}` : (form.value.business_owner == null ? '—' : departmentLabel(form.value.business_owner)) },

      { label: 'Description', value: form.value.description?.trim() || 'No description provided.', wide: true },
    ] },
    { title: 'Management', icon: 'business', fields: [
      { label: 'Managing Type', value: snapshot?.desc?.managing_type_name || (description.managing_type == null ? '—' : library.labelFor('managingTypes', description.managing_type)) },

      { label: 'Managing Office', value: office ? `${office.name || office.alias || 'Department'}${office.alias && office.name ? ` (${office.alias})` : ''}` : (description.managing_office == null ? '—' : departmentLabel(description.managing_office)) },

      { label: 'Third-Party Company', value: dash(description.third_party_company) },
      { label: 'Estimated Project Duration', value: description.estimation_project_duration == null ? '—' : `${description.estimation_project_duration} days` },
      { label: 'Project Roll-On', value: dash(description.project_roll_on) },
      { label: 'Project Sign-Off', value: dash(description.project_sign_off) },
    ] },
    { title: 'Technology Used', icon: 'memory', fields: [
      { label: 'Frontend Stack', value: stackNames(tech.frontend_stack) },
      { label: 'Backend Stack', value: stackNames(tech.backend_stack) },
      { label: 'Database', value: dash(tech.database) },
      { label: 'Server Type', value: dash(tech.server_type) },
      { label: 'Server Name', value: dash(tech.server_name) },
    ] },
    { title: 'Repository & Deployment', icon: 'account_tree', fields: [
      { label: 'Development Solution Type', value: snapshot?.repo?.development_solution_type_name || (repo.development_solution_type == null ? '—' : library.labelFor('developmentSolutionTypes', repo.development_solution_type)) },
      ...(isFullstackSolution.value ? [
        { label: 'Frontend Git Repository', value: dash(repo.frontend_repo_git), wide: true },
        { label: 'Frontend Staging URL', value: dash(repo.frontend_staging_url) },
        { label: 'Frontend Production URL', value: dash(repo.frontend_production_url) },
        { label: 'Backend Git Repository', value: dash(repo.backend_repo_git), wide: true },
        { label: 'Backend Staging URL', value: dash(repo.backend_staging_url) },
        { label: 'Backend Production URL', value: dash(repo.backend_production_url) },
      ] : [
        { label: 'Git Repository', value: dash(repo.repo_git), wide: true },
        { label: 'Staging URL', value: dash(repo.staging_url) },
        { label: 'Production URL', value: dash(repo.production_url) },
      ]),
    ] },
  ]
})

const search = ref('')
const statusFilter = ref<number | null>(null)
const loading = ref(false)
const loadError = ref('')
const saving = ref(false)
const formOpen = ref(false)
const profileOpen = ref(false)
// Frontend-only Scrum Planning preview. Task hierarchy follows ONE ICTMS traceability.
type ScrumSource = 'BRD' | 'SRS' | 'SDD' | 'User Stories'
type ScrumCategory = 'Frontend' | 'Backend' | 'DB' | 'UI/UX'
type ScrumReview = 'pending' | 'approved' | 'revision'
type ScrumDemoTask = {
  id: string; source: ScrumSource; category: ScrumCategory
  userStory: string; acceptanceCriteria: string; module: string
  title: string; description: string; dependencies: string[]
  points: number; priority: 'High' | 'Medium' | 'Low'
  review: ScrumReview; sprintId: number | null
}
type ScrumDemoSprint = { id: number; name: string }
// Illustrative tasks only: replace with API output based on the actual project documents.
// Proposed implementation examples derived from Phase 1 LGBTQIA+ Public User user stories.
// These are not actual AI output and are not extracted from BRD/SRS/SDD.
const demoScrumTasks: ScrumDemoTask[] = [
  { id: "DB-01", source: "User Stories", category: "DB", userStory: "US-01: As a Public User, I want to see a dynamic \"Latest Highlights\" feed on the landing page, so that I can immediately see the organization's active impact.", acceptanceCriteria: "The feed must be automated; when a new Activity or News item is published in the backend, it must automatically push to the top of the Home Page.", module: "Latest Highlights", title: "Design highlight content schema", description: "Create content metadata and publication-status/date fields needed to order highlights.", dependencies: [], points: 3, priority: "High", review: "pending", sprintId: null },
  { id: "BE-01", source: "User Stories", category: "Backend", userStory: "US-01: As a Public User, I want to see a dynamic \"Latest Highlights\" feed on the landing page, so that I can immediately see the organization's active impact.", acceptanceCriteria: "The feed must be automated; when a new Activity or News item is published in the backend, it must automatically push to the top of the Home Page.", module: "Latest Highlights", title: "Build latest highlights API", description: "Return newly published activities and news ordered by publication date, latest first.", dependencies: ["DB-01"], points: 5, priority: "High", review: "pending", sprintId: null },
  { id: "FE-01", source: "User Stories", category: "Frontend", userStory: "US-01: As a Public User, I want to see a dynamic \"Latest Highlights\" feed on the landing page, so that I can immediately see the organization's active impact.", acceptanceCriteria: "The feed must be automated; when a new Activity or News item is published in the backend, it must automatically push to the top of the Home Page.", module: "Latest Highlights", title: "Connect home feed to published content", description: "Request published highlights and refresh the card list on page load.", dependencies: ["BE-01"], points: 3, priority: "High", review: "pending", sprintId: null },
  { id: "UX-01", source: "User Stories", category: "UI/UX", userStory: "US-01: As a Public User, I want to see a dynamic \"Latest Highlights\" feed on the landing page, so that I can immediately see the organization's active impact.", acceptanceCriteria: "Each post card must include a Category Tag (e.g., \"Event,\" \"Success Story\"), a Title, Description, Category, Date Published and a \"Share to Social Media\" option.", module: "Highlights Cards", title: "Design responsive highlight cards", description: "Design cards displaying category, title, description, publication date, and share action.", dependencies: [], points: 3, priority: "Medium", review: "pending", sprintId: null },
  { id: "FE-02", source: "User Stories", category: "Frontend", userStory: "US-01: As a Public User, I want to see a dynamic \"Latest Highlights\" feed on the landing page, so that I can immediately see the organization's active impact.", acceptanceCriteria: "Each post card must include a Category Tag (e.g., \"Event,\" \"Success Story\"), a Title, Description, Category, Date Published and a \"Share to Social Media\" option.", module: "Highlights Cards", title: "Implement highlight cards and share controls", description: "Build reusable card components including the required metadata and social sharing affordance.", dependencies: ["UX-01", "FE-01"], points: 5, priority: "High", review: "pending", sprintId: null },
  { id: "FE-03", source: "User Stories", category: "Frontend", userStory: "US-01: As a Public User, I want to see a dynamic \"Latest Highlights\" feed on the landing page, so that I can immediately see the organization's active impact.", acceptanceCriteria: "If a post contains a video, a \"Play\" icon must overlay the thumbnail.", module: "Highlights Media", title: "Render video play overlay", description: "Detect video highlights and render an accessible play control on the thumbnail.", dependencies: ["FE-02"], points: 2, priority: "High", review: "pending", sprintId: null },
  { id: "FE-04", source: "User Stories", category: "Frontend", userStory: "US-02: As a Public User, I want to share LGBTQ-related highlights from the Home Page with others.", acceptanceCriteria: "Upon selection, the system automatically redirects and sends the content to the chosen platform", module: "Social Sharing", title: "Implement social-share redirect", description: "Open a supported sharing URL with the selected published highlight link.", dependencies: [], points: 3, priority: "High", review: "pending", sprintId: null },
  { id: "UX-02", source: "User Stories", category: "UI/UX", userStory: "US-02: As a Public User, I want to share LGBTQ-related highlights from the Home Page with others.", acceptanceCriteria: "The system presents the option for Facebook.", module: "Social Sharing", title: "Design Facebook sharing option", description: "Define the share control behavior and accessible label for Facebook sharing.", dependencies: [], points: 2, priority: "Medium", review: "pending", sprintId: null },
  { id: "FE-05", source: "User Stories", category: "Frontend", userStory: "US-02: As a Public User, I want to share LGBTQ-related highlights from the Home Page with others.", acceptanceCriteria: "The system presents the option for Facebook.", module: "Social Sharing", title: "Add Facebook sharing option", description: "Expose the Facebook choice and connect it to the sharing redirect.", dependencies: ["UX-02", "FE-04"], points: 2, priority: "High", review: "pending", sprintId: null },
  { id: "FE-06", source: "User Stories", category: "Frontend", userStory: "US-03: As a Public User, I want to read the organizational background so that I can understand its history, core values, vision and mission, and leadership.", acceptanceCriteria: "The text must support rich formatting (e.g., Bold, Italics, and Bullet points) to highlight key milestones.", module: "About Us", title: "Render formatted About Us content", description: "Support headings, bold, italic, and bullet lists in content display.", dependencies: [], points: 3, priority: "Medium", review: "pending", sprintId: null },
  { id: "UX-03", source: "User Stories", category: "UI/UX", userStory: "US-03: As a Public User, I want to read the organizational background so that I can understand its history, core values, vision and mission, and leadership.", acceptanceCriteria: "The Mission, Vision, Core Values, Organization History and Leadership Profile must be visually distinct (e.g., placed in a styled box or using specific headings).", module: "About Us", title: "Design About Us information layout", description: "Create distinct responsive sections for mission, vision, values, history, and leadership.", dependencies: [], points: 3, priority: "Medium", review: "pending", sprintId: null },
  { id: "FE-07", source: "User Stories", category: "Frontend", userStory: "US-03: As a Public User, I want to read the organizational background so that I can understand its history, core values, vision and mission, and leadership.", acceptanceCriteria: "The Mission, Vision, Core Values, Organization History and Leadership Profile must be visually distinct (e.g., placed in a styled box or using specific headings).", module: "About Us", title: "Implement About Us sections", description: "Build and style the five content sections with clear hierarchy.", dependencies: ["UX-03"], points: 3, priority: "High", review: "pending", sprintId: null },
  { id: "FE-08", source: "User Stories", category: "Frontend", userStory: "US-03: As a Public User, I want to read the organizational background so that I can understand its history, core values, vision and mission, and leadership.", acceptanceCriteria: "If a \"History\" image or brand photo is included, it must be responsive and centered.", module: "About Us Media", title: "Implement responsive history image", description: "Center optional images and provide responsive sizing and alternate text.", dependencies: ["FE-07"], points: 2, priority: "Medium", review: "pending", sprintId: null },
]
const scrumAcknowledgementOpen = ref(false)
const scrumExecutionAcknowledged = ref(false)
const scrumAcknowledgementDocuments = [
  { code: 'BRD', name: 'Business Requirements Document', icon: 'assignment' },
  { code: 'SRS', name: 'Software Requirements Specification', icon: 'rule' },
  { code: 'SDD', name: 'System Design Document', icon: 'architecture' },
  { code: 'User Stories', name: 'User Stories', icon: 'format_list_bulleted' },
] as const
function requestScrumExecution(): void {
  scrumExecutionAcknowledged.value = false
  scrumAcknowledgementOpen.value = true
}
function cancelScrumExecution(): void {
  scrumAcknowledgementOpen.value = false
  scrumExecutionAcknowledged.value = false
}
function confirmScrumExecution(): void {
  if (!scrumExecutionAcknowledged.value) return
  scrumAcknowledgementOpen.value = false
  openScrumPlanning()
}
const scrumPlanningOpen = ref(false)
const scrumTasks = ref<ScrumDemoTask[]>([])
const scrumSprints = ref<ScrumDemoSprint[]>([{ id: 1, name: 'Sprint 1' }, { id: 2, name: 'Sprint 2' }])
const activeSprintId = ref(1)
const scrumCategoryFilter = ref('All Categories')
const scrumCategoryFilters = ['All Categories', 'Frontend', 'Backend', 'DB', 'UI/UX'] as const
const scrumTaskView = ref<'categories' | 'traceability'>('categories')
const expandedScrumTaskId = ref<string | null>(null)
const selectedScrumStory = ref<string | null>(null)
const selectedScrumCriterion = ref<string | null>(null)
const scrumUserStories = computed(() => [...new Set(scrumTasks.value.map(task => task.userStory))])
const scrumStoryCriteria = computed(() => [...new Set(scrumTasks.value.filter(task => task.userStory === selectedScrumStory.value).map(task => task.acceptanceCriteria))])
function selectScrumStory(story: string): void {
  selectedScrumStory.value = story
  selectedScrumCriterion.value = null
}
const scrumDraggingId = ref<string | null>(null)
const scrumDropOver = ref(false)
const reviewedScrumTasks = computed(() => scrumTasks.value.filter(task => task.review !== 'pending').length)
const scheduledScrumTasks = computed(() => scrumTasks.value.filter(task => task.sprintId !== null).length)
const unscheduledScrumTasks = computed(() => scrumTasks.value.filter(task => task.sprintId === null).length)
const visibleScrumSuggestions = computed(() => scrumTasks.value.filter(task => {
  if (scrumTaskView.value === 'categories') return task.sprintId === null && (scrumCategoryFilter.value === 'All Categories' || task.category === scrumCategoryFilter.value)
  return task.userStory === selectedScrumStory.value && (selectedScrumCriterion.value === null || task.acceptanceCriteria === selectedScrumCriterion.value)
}))
// Connect each acceptance criterion to its module and the actual tasks created for it.
const visibleScrumTaskGroups = computed(() => {
  if (scrumTaskView.value === 'categories') {
    return [{ key: 'category-list', criterion: '', module: '', tasks: visibleScrumSuggestions.value }]
  }
  const groups = new Map<string, { key: string; criterion: string; module: string; tasks: ScrumDemoTask[] }>()
  for (const task of visibleScrumSuggestions.value) {
    const key = JSON.stringify([task.acceptanceCriteria, task.module])
    let group = groups.get(key)
    if (!group) {
      group = { key, criterion: task.acceptanceCriteria, module: task.module, tasks: [] }
      groups.set(key, group)
    }
    group.tasks.push(task)
  }
  return [...groups.values()]
})
function scrumGroupsForCriterion(criterion: string): { module: string; tasks: ScrumDemoTask[] }[] {
  const groups = new Map<string, ScrumDemoTask[]>()
  for (const task of scrumTasks.value) {
    if (task.userStory !== selectedScrumStory.value || task.acceptanceCriteria !== criterion) continue
    const tasks = groups.get(task.module) ?? []
    tasks.push(task)
    groups.set(task.module, tasks)
  }
  return [...groups].map(([module, tasks]) => ({ module, tasks }))
}
const activeScrumSprintTasks = computed(() => scrumTasks.value.filter(task => task.sprintId === activeSprintId.value))
const activeScrumSprintName = computed(() => scrumSprints.value.find(sprint => sprint.id === activeSprintId.value)?.name ?? 'Sprint')
const activeScrumSprintPoints = computed(() => activeScrumSprintTasks.value.reduce((sum, task) => sum + task.points, 0))
function scrumReviewLabel(review: ScrumReview): string {
  if (review === 'approved') return 'Approved'
  if (review === 'revision') return 'Needs revision'
  return 'Pending review'
}
function canPlanScrumTask(task: ScrumDemoTask): boolean {
  return task.review === 'approved' && task.dependencies.every(dep => scrumTasks.value.find(candidate => candidate.id === dep)?.review === 'approved')
}
function countScrumSprintTasks(id: number): number { return scrumTasks.value.filter(task => task.sprintId === id).length }
function openScrumPlanning(): void {
  scrumTasks.value = demoScrumTasks.map(task => ({ ...task }))
  scrumSprints.value = [{ id: 1, name: 'Sprint 1' }, { id: 2, name: 'Sprint 2' }]
  activeSprintId.value = 1
  scrumCategoryFilter.value = 'All Categories'
  scrumTaskView.value = 'traceability'
  selectedScrumStory.value = scrumUserStories.value[0] ?? null
  selectedScrumCriterion.value = null
  scrumDraggingId.value = null
  scrumPlanningOpen.value = true
}
function addScrumSprint(): void {
  const nextId = Math.max(0, ...scrumSprints.value.map(sprint => sprint.id)) + 1
  scrumSprints.value.push({ id: nextId, name: `Sprint ${nextId}` })
  activeSprintId.value = nextId
}
function moveScrumTask(id: string, sprintId: number | null): void {
  const task = scrumTasks.value.find(item => item.id === id)
  if (task && (sprintId === null || (task.review === 'approved' && task.dependencies.every(dep => scrumTasks.value.find(candidate => candidate.id === dep)?.review === 'approved')))) task.sprintId = sprintId
}
function onScrumDragStart(event: DragEvent, id: string): void {
  scrumDraggingId.value = id
  if (event.dataTransfer) { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', id) }
}
function onScrumDropToSprint(event: DragEvent): void {
  scrumDropOver.value = false
  const id = event.dataTransfer?.getData('text/plain') || scrumDraggingId.value
  if (id) moveScrumTask(id, activeSprintId.value)
  scrumDraggingId.value = null
}
function onScrumDropToBacklog(event: DragEvent): void {
  event.preventDefault()
  const id = event.dataTransfer?.getData('text/plain') || scrumDraggingId.value
  if (id) moveScrumTask(id, null)
  scrumDraggingId.value = null
}

const formStep = ref(1)
const stepLabels = ['System Profile', 'Management', 'Documents', 'Stakeholders', 'Technology Used', 'Repository']
const wizardStepLabels = computed(() => editingId.value === null ? stepLabels : ['Details', ...stepLabels.slice(1)])
const wizardStepIcons = ['dashboard_customize', 'corporate_fare', 'description', 'groups', 'memory', 'account_tree']

// The Registry API persists { docs_type, file_path } only. Pending markers below
// are NOT real file locations; they let Create/Update create registry_docs rows
// before actual upload/draft APIs exist. Assignee and draft content remain local.
const documentFiles = ref<Record<string, string>>({})
// Keep a renamed File object for a future multipart upload endpoint.
// File selection alone does NOT persist a document on the backend.
const documentFileObjects = ref<Record<string, File>>({})
const documentDraftNames = ref<Record<string, string>>({})
const documentDraftContents = ref<Record<string, string>>({})
const documentDraftDialog = ref(false)
const editingDraftIndex = ref<number | null>(null)
const editingDraftName = ref('')
const editingDraftContent = ref('')
const editingDraftEnabled = ref(false)
const documentAssignees = ref<Record<string, number>>({})
const documentPathDialog = ref(false)
const editingDocumentIndex = ref<number | null>(null)
const editingDocumentPath = ref('')
const documentPreviewUrls: string[] = []
const documentAssigneeDialog = ref(false)
const assigningDocument = ref<string | null>(null)
const selectedDocumentAssignee = ref<number | null>(null)
const documentAssigneeFilter = ref('')
// Match the existing Document Library IDs and ordering: BRD=1, SRS=2, SDD=3, User Stories=4.
const registryDocumentTypeIds = [1, 2, 3, 4]
function initialRegistryDocs(): RegistryForm['docs'] {
  return registryDocumentTypeIds.map(docs_type => ({ docs_type, file_path: '' }))
}
function registryDocsForEdit(existing: RegistryForm['docs']): RegistryForm['docs'] {
  const fixed = registryDocumentTypeIds.map(docs_type => ({
    docs_type,
    file_path: existing.find(item => Number(item.docs_type) === docs_type)?.file_path ?? '',
  }))
  // Keep legacy document types in the payload even though only four standard rows are displayed.
  const legacy = existing.filter(item => !registryDocumentTypeIds.includes(Number(item.docs_type)))
  return [...fixed, ...legacy]
}
function triggerDocumentFile(index: number): void {
  document.getElementById(`registry-file-${index}`)?.click()
}
function createDocumentDraftName(index: number): void {
  const doc = form.value.docs[index]
  const key = String(index)
  if (!doc || (managementMode.value !== 'joint' && !documentAssignees.value[key]) || (doc.file_path?.trim() && !isPendingDocumentPath(doc.file_path)) || documentFiles.value[key]) return
  const name = library.labelFor('documentTypes', Number(doc.docs_type)) || `Document ${index + 1}`
  documentDraftNames.value[key] = `${name} — Draft`
  documentDraftContents.value[key] = `# ${name}\n\n## Overview\n\n## Objectives\n\n## Requirements\n\n## Notes\n`
  $q.notify({ type: 'info', message: 'A local draft template was created. AI generation is not connected yet.' })
  openDocumentDraft(index, true)
}
function openDocumentDraft(index: number, editable: boolean): void {
  const key = String(index)
  if (!documentDraftNames.value[key]) return
  editingDraftIndex.value = index
  editingDraftName.value = documentDraftNames.value[key]
  editingDraftContent.value = documentDraftContents.value[key] ?? ''
  editingDraftEnabled.value = editable
  documentDraftDialog.value = true
}
function saveDocumentDraft(): void {
  if (editingDraftIndex.value === null) return
  documentDraftContents.value[String(editingDraftIndex.value)] = editingDraftContent.value
  documentDraftDialog.value = false
  $q.notify({ type: 'positive', message: 'Draft saved locally in this form.' })
}
// Document Library IDs: 1=BRD, 2=SRS, 3=SDD, 4=User Stories.
const documentAliases: Record<number, string> = { 1: 'BRD', 2: 'SRS', 3: 'SDD', 4: 'US' }
const PENDING_DOC_PREFIX = '__pending_document__/'
const PENDING_DRAFT_PREFIX = '__pending_draft__/'
const PENDING_UPLOAD_PREFIX = '__pending_upload__/'
function isPendingDocumentPath(path?: string | null): boolean {
  return Boolean(path && [PENDING_DOC_PREFIX, PENDING_DRAFT_PREFIX, PENDING_UPLOAD_PREFIX].some(prefix => path.startsWith(prefix)))
}
function documentDateStamp(): string {
  const now = new Date()
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
}
// Always provide the 4 standard document records to Registry Create/Update.
// A pending marker is a workflow placeholder, never proof of uploaded content.
function docsForRegistryPayload(): NonNullable<RegistryPayload['docs']> {
  return form.value.docs.filter(doc => Number(doc.docs_type) > 0).map((doc, index) => {
    const type = Number(doc.docs_type)
    const key = String(index)
    const existing = doc.file_path?.trim() ?? ''
    const alias = documentAliases[type] ?? `DOC${type}`
    const fileName = documentFiles.value[key]
    const isDraft = Boolean(documentDraftNames.value[key])
    let filePath = existing
    if (fileName) filePath = `${PENDING_UPLOAD_PREFIX}${fileName}`
    else if (isDraft) filePath = `${PENDING_DRAFT_PREFIX}${documentDateStamp()}_${alias}.md`
    else if (!filePath) filePath = `${PENDING_DOC_PREFIX}${alias}`
    return { docs_type: type, file_path: filePath }
  })
}
function datedDocumentFileName(file: File, docsType: number): string {
  const now = new Date()
  const dateStamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const alias = documentAliases[docsType] ?? `DOC${docsType}`
  const extension = /\.[a-zA-Z0-9]+$/.exec(file.name)?.[0]?.toLowerCase() ?? ''
  return `${dateStamp}_${alias}${extension}`
}
function onDocumentFileSelected(key: string, event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const index = Number(key)
  const doc = form.value.docs[index]
  if (!doc) return

  const filename = datedDocumentFileName(file, Number(doc.docs_type))
  // Rename the local File object rather than changing only the displayed text.
  // It remains in memory until a file-upload API is implemented.
  const renamedFile = new File([file], filename, { type: file.type, lastModified: file.lastModified })
  documentFileObjects.value[key] = renamedFile
  documentFiles.value[key] = renamedFile.name
  delete documentDraftNames.value[key]
  delete documentDraftContents.value[key]
  input.value = '' // Re-selecting the same physical file should still trigger change.
  $q.notify({ type: 'info', message: `${filename} selected locally. The file has not been uploaded to the server.` })
}
function viewDocumentFile(index: number): void {
  const key = String(index)
  if (!documentFileObjects.value[key] && !form.value.docs[index]?.file_path?.trim() && documentDraftNames.value[key]) {
    openDocumentDraft(index, false)
    return
  }
  const localFile = documentFileObjects.value[key]
  if (localFile) {
    const url = URL.createObjectURL(localFile)
    documentPreviewUrls.push(url)
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }
  const path = form.value.docs[index]?.file_path?.trim()
  if (!path || isPendingDocumentPath(path)) {
    $q.notify({ type: 'info', message: 'This record is pending. No server file is available to preview.' })
    return
  }
  try {
    // Only open web-addressable paths. A server storage path may not be a public URL.
    const url = new URL(path, window.location.origin)
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported path')
    window.open(url.href, '_blank', 'noopener,noreferrer')
  } catch {
    $q.notify({ type: 'warning', message: 'This file path cannot be opened directly. Use a public or authenticated file-view URL.' })
  }
}
function editDocumentFile(index: number): void {
  const doc = form.value.docs[index]
  if (!doc) return
  if ((!doc.file_path?.trim() || isPendingDocumentPath(doc.file_path)) && !documentFileObjects.value[String(index)] && documentDraftNames.value[String(index)]) {
    openDocumentDraft(index, true)
    return
  }
  if (!doc.file_path?.trim() && documentFileObjects.value[String(index)]) {
    // Locally selected files have no saved server path to edit.
    triggerDocumentFile(index)
    return
  }
  editingDocumentIndex.value = index
  editingDocumentPath.value = doc.file_path ?? ''
  documentPathDialog.value = true
}
function saveDocumentPath(): void {
  const index = editingDocumentIndex.value
  if (index == null) return
  const doc = form.value.docs[index]
  if (!doc) return
  doc.file_path = editingDocumentPath.value.trim()
  // An edited stored path supersedes a previous locally selected file.
  delete documentFileObjects.value[String(index)]
  delete documentFiles.value[String(index)]
  documentPathDialog.value = false
  editingDocumentIndex.value = null
}
function removeDocumentAssignee(key: string): void {
  delete documentAssignees.value[key]
  if (assigningDocument.value === key) {
    assigningDocument.value = null
    selectedDocumentAssignee.value = null
  }
  $q.notify({ type: 'info', message: 'Document task assignment removed from this form.' })
}
const documentAssigneeOptions = computed<{ label: string; value: number }[]>(() => {
  // Document tasks can only be assigned to actual Managing Office department members.
  // Never fall back to Business Owner users or the signed-in account.
  if (!isInternallyManaged.value) return []
  const officeId = Number(form.value.desc.managing_office)
  if (!Number.isInteger(officeId) || officeId <= 0) return []
  return (departmentDirectory.value[officeId] ?? [])
    .filter(user => Number.isInteger(Number(user.id)) && Number(user.id) > 0)
    .map(user => ({ label: user.name?.trim() || `User #${user.id}`, value: Number(user.id) }))
    .sort((a, b) => a.label.localeCompare(b.label))
})
const filteredDocumentAssigneeOptions = computed(() => {
  const term = documentAssigneeFilter.value.toLowerCase().trim()
  return documentAssigneeOptions.value.filter(option => !term || option.label.toLowerCase().includes(term))
})
function filterDocumentAssignees(value: string, update: (callback: () => void) => void): void {
  update(() => { documentAssigneeFilter.value = value })
}
function documentAssigneeName(id?: number): string {
  return documentAssigneeOptions.value.find(option => option.value === id)?.label ?? (id ? `User #${id}` : 'Unassigned')
}
function openDocumentAssignee(key: string): void {
  assigningDocument.value = key
  const existing = documentAssignees.value[key]
  selectedDocumentAssignee.value = existing != null && documentAssigneeOptions.value.some(option => option.value === existing) ? existing : null
  documentAssigneeFilter.value = ''
  documentAssigneeDialog.value = true
}
function assignDocumentTask(): void {
  const key = assigningDocument.value
  const id = selectedDocumentAssignee.value
  if (!key || id === null || !documentAssigneeOptions.value.some(option => option.value === id)) {
    $q.notify({ type: 'warning', message: 'Please choose a user from the selected Managing Office.' })
    return
  }
  documentAssignees.value[key] = id
  documentAssigneeDialog.value = false
  $q.notify({ type: 'info', message: 'Task assigned in this form only. Backend task persistence is not yet available.' })
}
function resetDocumentWorkspace(): void {
  documentFileObjects.value = {}
  documentFiles.value = {}
  documentDraftNames.value = {}
  documentDraftContents.value = {}
  documentDraftDialog.value = false
  editingDraftIndex.value = null
  editingDraftContent.value = ''
  documentAssignees.value = {}
  documentPathDialog.value = false
  editingDocumentIndex.value = null
  editingDocumentPath.value = ''
  for (const url of documentPreviewUrls.splice(0)) URL.revokeObjectURL(url)
  documentAssigneeDialog.value = false
}

const addChoiceOpen = ref(false)
const existingSearchOpen = ref(false)
const existingQuery = ref('')
const existingOpeningId = ref<number | null>(null)
const existingOpening = computed(() => existingOpeningId.value !== null)
const existingMatches = computed(() => {
  const q = existingQuery.value.trim().toLowerCase()
  return systems.value.filter(item =>
    !q || [item.system_name, item.alias, item.description].some(value => String(value ?? '').toLowerCase().includes(q)),
  ).slice(0, 100)
})
const viewOpen = ref(false)
const editingId = ref<number | null>(null)
const pagination = ref({ page: 1, rowsPerPage: 10 })
// Initialize before watchers and computed expressions that access form.value.
const form = ref<RegistryForm>(emptyForm())
// Observe Managing Office changes only after the form ref is initialized.
watch(() => [form.value.desc.managing_type, form.value.desc.managing_office], () => {
  selectedDocumentAssignee.value = null
  documentAssigneeFilter.value = ''
})
type StakeholderUser = { id: number; name: string; email: string | null; departmentIds: number[] }
type StakeholderSectionKey = 'owner' | 'office'
const departmentUsersLoading = ref(false)
const departmentDirectory = ref<Record<number, DepartmentUser[]>>({})
const departmentErrors = ref<Record<number, string>>({})
const departmentLoadedIds = ref<number[]>([])
let departmentRequestVersion = 0
// Resolve management mode by Library name/alias rather than assuming fixed IDs.
type ManagementMode = 'internal' | 'third-party' | 'joint' | 'other' | 'unselected'
function managementModeFor(typeId: number | null | undefined): ManagementMode {
  if (typeId == null) return 'unselected'
  const entry = library.managingTypes.find(item => Number(item.id) === Number(typeId))
  if (!entry) return 'other'
  const label = `${entry.name} ${entry.alias ?? ''}`.toLowerCase()
  if (/\b(joint(?:ly)?|hybrid|mixed|co[\s_-]*managed|both)\b/.test(label)) return 'joint'
  if (/third[\s_-]*party|externally?|outsourc|vendor/.test(label)) return 'third-party'
  if (/internally?|in[\s_-]*house/.test(label)) return 'internal'
  return 'other'
}
const managementMode = computed<ManagementMode>(() => managementModeFor(form.value.desc.managing_type))
const showManagingOffice = computed(() => managementMode.value === 'internal' || managementMode.value === 'joint' || managementMode.value === 'other')
const showThirdPartyCompany = computed(() => managementMode.value === 'third-party' || managementMode.value === 'joint' || managementMode.value === 'other')
const isInternallyManaged = computed(() => showManagingOffice.value)
function onManagingTypeChanged(value: number | null): void {
  // Clear fields hidden by the newly selected mode; do not send stale associations.
  const mode = managementModeFor(value)
  if (mode === 'internal') form.value.desc.third_party_company = null
  if (mode === 'third-party') form.value.desc.managing_office = null
  if (mode === 'unselected') {
    form.value.desc.managing_office = null
    form.value.desc.third_party_company = null
  }
}
// Load Business Owner users and, only for internal/joint management, Managing Office users.
const stakeholderSourceDepartments = computed(() => {
  const ids: number[] = []
  const owner = Number(form.value.business_owner)
  const office = Number(form.value.desc.managing_office)
  if (Number.isInteger(owner) && owner > 0) ids.push(owner)
  if (isInternallyManaged.value && Number.isInteger(office) && office > 0 && !ids.includes(office)) ids.push(office)
  return ids
})
const projectManagerRole = computed(() => library.stakeholderTypes.find(role =>
  /project[\s_-]*manager/i.test(`${role.name} ${role.alias ?? ''}`),
))
const loggedInUserName = computed(() => {
  const user = auth.user
  if (!user) return 'Signed-in user'
  const details = user.details
  return [details?.first_name, details?.middle_name, details?.last_name, details?.ext_name]
    .filter(Boolean).join(' ') || user.username || user.email || `User #${user.id}`
})
const sectionSelections = ref<Record<StakeholderSectionKey, number[]>>({ owner: [], office: [] })
const sectionRoles = ref<Record<StakeholderSectionKey, number | null>>({ owner: null, office: null })
const departmentUsers = computed<StakeholderUser[]>(() => {
  const byId = new Map<number, StakeholderUser>()
  for (const departmentId of stakeholderSourceDepartments.value) {
    for (const user of departmentDirectory.value[departmentId] ?? []) {
      const id = Number(user.id)
      if (!Number.isInteger(id) || id <= 0) continue
      const previous = byId.get(id)
      if (previous) {
        if (!previous.departmentIds.includes(departmentId)) previous.departmentIds.push(departmentId)
      } else {
        byId.set(id, { id, name: user.name?.trim() || `User #${id}`, email: user.email ?? null, departmentIds: [departmentId] })
      }
    }
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name))
})
const stakeholderSections = computed(() => {
  const sections: { key: StakeholderSectionKey; title: string; departmentId: number | null; users: StakeholderUser[] }[] = [
    { key: 'owner', title: 'Business Owner', departmentId: form.value.business_owner ?? null, users: [] },
  ]
  if (isInternallyManaged.value) {
    sections.push({ key: 'office', title: 'Managing Office', departmentId: form.value.desc.managing_office ?? null, users: [] })
  }
  return sections.map(section => ({
    ...section,
    users: departmentUsers.value.filter(user => section.departmentId != null && user.departmentIds.includes(section.departmentId)),
  }))
})
async function loadDepartmentUsers(): Promise<void> {
  const version = ++departmentRequestVersion
  const ids = [...stakeholderSourceDepartments.value]
  departmentDirectory.value = {}
  departmentErrors.value = {}
  departmentLoadedIds.value = []
  sectionSelections.value = { owner: [], office: [] }
  if (!formOpen.value || ids.length === 0) {
    departmentUsersLoading.value = false
    return
  }
  departmentUsersLoading.value = true
  // One failed department must not hide successfully loaded users in the other.
  await Promise.all(ids.map(async departmentId => {
    try {
      const users = await libraryApi.departmentUsers(departmentId)
      if (version !== departmentRequestVersion) return
      departmentDirectory.value = { ...departmentDirectory.value, [departmentId]: users }
    } catch (error) {
      if (version !== departmentRequestVersion) return
      departmentErrors.value = { ...departmentErrors.value, [departmentId]: errorMessage(error) }
    } finally {
      if (version === departmentRequestVersion) departmentLoadedIds.value = [...departmentLoadedIds.value, departmentId]
    }
  }))
  if (version === departmentRequestVersion) departmentUsersLoading.value = false
}
function reloadDepartmentUsers(): void { void loadDepartmentUsers() }
function isStakeholderSelected(id: number): boolean {
  return form.value.stakeholders.some(item => Number(item.user_id) === id)
}
function stakeholderTypeFor(id: number): number | null {
  return form.value.stakeholders.find(item => Number(item.user_id) === id)?.stakeholder_type ?? null
}
function selectSectionUser(key: StakeholderSectionKey, id: number, checked: boolean | null): void {
  const current = sectionSelections.value[key]
  sectionSelections.value[key] = checked ? [...new Set([...current, id])] : current.filter(userId => userId !== id)
}
function allSectionUsersSelected(key: StakeholderSectionKey, users: StakeholderUser[]): boolean {
  return users.length > 0 && users.every(user => sectionSelections.value[key].includes(user.id))
}
function selectSectionUsers(key: StakeholderSectionKey, users: StakeholderUser[], checked: boolean | null): void {
  const ids = new Set(users.map(user => user.id))
  sectionSelections.value[key] = checked
    ? [...new Set([...sectionSelections.value[key], ...ids])]
    : sectionSelections.value[key].filter(id => !ids.has(id))
}
// The API stores a user ID and role, not an assignment-source department.
// Infer department membership from the loaded directory, without mislabeling unknown users.
const assignedStakeholderSections = computed(() => stakeholderSections.value.map(section => {
  const departmentId = section.departmentId
  const matching = form.value.stakeholders.filter(person =>
    departmentId != null && departmentUsers.value.some(user =>
      Number(user.id) === Number(person.user_id) && user.departmentIds.includes(departmentId),
    ),
  )
  const groups = library.stakeholderTypes.map(role => ({
    id: Number(role.id),
    name: role.name,
    users: matching.filter(person => Number(person.stakeholder_type) === Number(role.id)),
  })).filter(group => group.users.length > 0)
  return { ...section, users: matching, groups }
}))
const unclassifiedStakeholderGroups = computed(() => {
  const knownIds = new Set(assignedStakeholderSections.value.flatMap(section => section.users.map(user => Number(user.user_id))))
  const unknown = form.value.stakeholders.filter(person => !knownIds.has(Number(person.user_id)))
  return library.stakeholderTypes.map(role => ({
    id: Number(role.id), name: role.name,
    users: unknown.filter(person => Number(person.stakeholder_type) === Number(role.id)),
  })).filter(group => group.users.length > 0)
})
function assignSectionStakeholders(key: StakeholderSectionKey): void {
  const role = sectionRoles.value[key]
  if (role == null || !library.stakeholderTypes.some(item => Number(item.id) === Number(role))) {
    $q.notify({ type: 'warning', message: 'Choose a valid Stakeholder Type.' })
    return
  }
  const selectedIds = [...sectionSelections.value[key]]
  if (!selectedIds.length) return
  // The Registry payload allows one stakeholder type per user; assigning the same
  // user from a second department updates that user's role rather than duplicating it.
  const assignments = new Map(form.value.stakeholders.map(item => [Number(item.user_id), item]))
  for (const id of selectedIds) assignments.set(id, { user_id: id, stakeholder_type: Number(role) })
  form.value.stakeholders = [...assignments.values()]
  sectionSelections.value[key] = []
  sectionRoles.value[key] = null
  $q.notify({ type: 'positive', message: `${selectedIds.length} user${selectedIds.length === 1 ? '' : 's'} assigned successfully.` })
}
function removeStakeholder(id: number): void {
  form.value.stakeholders = form.value.stakeholders.filter(item => Number(item.user_id) !== id)
}
function userDisplayName(id: number): string {
  const user = departmentUsers.value.find(item => item.id === Number(id))
  if (user) return user.email ? `${user.name} (${user.email})` : user.name
  if (Number(auth.user?.id) === Number(id)) return `${loggedInUserName.value} (you)`
  return `User #${id}`
}
function userInitials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0).toUpperCase()).join('') || '?'
}
watch(
  () => [formOpen.value, form.value.business_owner, form.value.desc.managing_office, isInternallyManaged.value, formStep.value === 4] as const,
  () => { void loadDepartmentUsers() },
)


function emptyForm(): RegistryForm {
  return {
    system_name: '', alias: '', description: '', business_owner: null, status: null,
    desc: { managing_type: null, managing_office: null, third_party_company: null, project_roll_on: null, project_sign_off: null, estimation_project_duration: null },
    repo: { development_solution_type: null, repo_git: null, staging_url: null, production_url: null,
      frontend_repo_git: null, frontend_staging_url: null, frontend_production_url: null,
      backend_repo_git: null, backend_staging_url: null, backend_production_url: null },
    tech_stack: { frontend_stack: [], backend_stack: [], database: null, server_type: null, server_name: null },
    stakeholders: [], docs: initialRegistryDocs(),
  }
}

const repositoryScopes = ['frontend', 'backend'] as const
const isFullstackSolution = computed(() => {
  const option = library.developmentSolutionTypes.find(item => Number(item.id) === Number(form.value.repo.development_solution_type))
  return Boolean(option && /^FULLSTACK$/i.test(option.name.replace(/[^a-z]/gi, '')))
})
function solutionTypeIcon(label: string): string {
  const token = label.toUpperCase().replace(/[^A-Z]/g, '')
  if (token === 'FULLSTACK') return 'layers'
  if (token === 'FRONTEND') return 'desktop_windows'
  if (token === 'BACKEND') return 'dns'
  if (token === 'MOBILE') return 'smartphone'
  return 'computer'
}
function selectDevelopmentSolution(id: number): void {
  // Keep both sets of values while switching the UI. Only the selected mode is submitted.
  form.value.repo.development_solution_type = id
}
function reposFromApi(record: RegistryApiWithRepos): RegistryRepositoryForm {
  const current = record.repo ?? null
  const result: RegistryRepositoryForm = {
    repo_git: current?.repo_git ?? null,
    staging_url: current?.staging_url ?? null,
    production_url: current?.production_url ?? null,
    development_solution_type: current?.development_solution_type ?? null,
  }
  for (const repo of record.repos ?? []) {
    if (repo.repo_scope === 'frontend' || repo.repo_scope === 'backend') {
      const scope = repo.repo_scope
      result[`${scope}_repo_git`] = repo.repo_git ?? null
      result[`${scope}_staging_url`] = repo.staging_url ?? null
      result[`${scope}_production_url`] = repo.production_url ?? null
    } else if (repo.repo_scope === 'single') {
      result.repo_git = repo.repo_git ?? null
      result.staging_url = repo.staging_url ?? null
      result.production_url = repo.production_url ?? null
    }
    result.development_solution_type ??= repo.development_solution_type ?? null
  }
  // Supports an API that returns the six scoped values in the legacy repo object.
  return { ...result, ...(current ?? {}) }
}
const departmentOptions = computed(() => library.departments)
const selectedStatusName = computed(() => library.registryStatuses.find(item => Number(item.id) === Number(form.value.status))?.name ?? '')
const statusOptions = computed(() => library.registryStatuses.map(item => ({ label: item.name, value: item.id })))
const filteredSystems = computed(() => systems.value.filter((item) => {
  const term = (search.value || '').trim().toLowerCase()
  const matches = !term || [item.system_name, item.alias, item.description, departmentLabel(item.business_owner)]
    .some(value => String(value || '').toLowerCase().includes(term))
  return matches && (statusFilter.value === null || Number(item.status) === Number(statusFilter.value))
}))
const statistics = computed(() => {
  const countStatus = (tokens: string[]) => systems.value.filter(item => {
    const label = statusLabel(item.status).toLowerCase()
    return tokens.some(token => label.includes(token))
  }).length
  return [
    { label: 'TOTAL SYSTEMS', count: systems.value.length, description: 'Registered information systems', icon: 'layers', theme: 'total' },
    { label: 'DEPLOYED', count: countStatus(['deployed', 'active', 'operational']), description: 'Live systems', icon: 'check_circle', theme: 'active' },
    { label: 'FOR DEPLOYMENT', count: countStatus(['for deployment', 'pending deployment']), description: 'Awaiting rollout', icon: 'hourglass_top', theme: 'review' },
    { label: 'UNDER DEVELOPMENT', count: countStatus(['development', 'in progress']), description: 'In development', icon: 'build_circle', theme: 'development' },
    { label: 'DECOMMISSIONED', count: countStatus(['decommission', 'retired', 'archiv']), description: 'Retired systems', icon: 'inventory_2', theme: 'archived' },
  ]
})
const columns: QTableColumn<RegistryRecord>[] = [
  { name: 'system_name', label: 'SYSTEM NAME', field: 'system_name', align: 'left', sortable: true },
  { name: 'alias', label: 'ALIAS', field: row => row.alias || '—', align: 'left', sortable: true },
  { name: 'business_owner', label: 'BUSINESS OWNER', field: row => departmentLabel(row.business_owner), align: 'left', sortable: true },
  { name: 'status', label: 'STATUS', field: row => statusLabel(row.status), align: 'left', sortable: true },
  { name: 'updated_at', label: 'UPDATED', field: row => row.updated_at || '', align: 'left', sortable: true },
  { name: 'actions', label: 'ACTIONS', field: 'id', align: 'center' },
]

function requiredText(value: unknown): true | string {
  return (typeof value === 'string' && value.trim().length > 0) || 'This field is required'
}
function requiredId(value: unknown): true | string { return Number(value) > 0 || 'Select a valid option' }
function techLabel(item: LibraryOption): string { return item.version ? `${item.name} (${item.version})` : item.name }
function statusLabel(id: number | null | undefined): string { return library.labelFor('registryStatuses', id) }
function departmentLabel(id: number | null | undefined): string { return library.labelFor('departments', id) }
function stackNames(ids: number[] | undefined): string {
  return ids?.length ? ids.map(id => library.labelFor('techStacks', id)).join(', ') : '—'
}
function stakeholderNames(items: RegistryRecord['stakeholders']): string {
  return items?.length ? items.map(item => `User #${item.user_id} (${library.labelFor('stakeholderTypes', item.stakeholder_type)})`).join('; ') : '—'
}
function documentNames(items: RegistryRecord['docs']): string {
  return items?.length ? items.map(item => `${library.labelFor('documentTypes', item.docs_type)}: ${item.file_path}`).join('; ') : '—'
}
function statusClass(label: string): string {
  const lower = label.toLowerCase()
  return lower.includes('for deployment') ? 'is-review' : lower.includes('development') ? 'is-development' : lower.includes('decommission') || lower.includes('archiv') || lower.includes('retir') ? 'is-archived' : ''
}
function formatDate(raw?: string): string {
  if (!raw) return '—'
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' }).format(date)
}
function normalizeRecord(row: RegistryRecord): RegistryRecord {
  // RegistryResource may expose the related model as `registry_desc` rather than `desc`.
  const extra = row as RegistryRecord & { registry_desc?: RegistryPayload['desc']; registryDesc?: RegistryPayload['desc'] }
  return { ...row, desc: row.desc ?? extra.registry_desc ?? extra.registryDesc ?? null }
}
async function loadRegistries(): Promise<void> {
  if (loading.value) return
  // Keep existing rows visible during refresh; spinner is only shown for the first load.
  loading.value = true
  loadError.value = ''
  try {
    const response = await registryApi.list()
    if (!response.success || !Array.isArray(response.data)) throw new Error(response.message || 'Unable to load registries')
    systems.value = response.data.map(normalizeRecord)
  } catch (error) {
    loadError.value = errorMessage(error)
    $q.notify({ type: 'negative', message: loadError.value })
  } finally { loading.value = false }
}
async function loadLibraries(): Promise<void> {
  const results = await Promise.allSettled([library.load('departments'), library.loadRegistryLibraries()])
  if (results.some(result => result.status === 'rejected')) {
    $q.notify({ type: 'warning', message: 'Some Library options could not be loaded. Check Library API availability.' })
  }
}
function openAddSystemChoice(): void {
  addChoiceOpen.value = true
}
function chooseNewSystem(): void {
  addChoiceOpen.value = false
  openCreate()
}
function chooseExistingSystem(): void {
  addChoiceOpen.value = false
  existingQuery.value = ''
  existingSearchOpen.value = true
  void loadRegistries()
}
async function selectExistingSystem(id: number): Promise<void> {
  if (existingOpening.value) return
  existingOpeningId.value = id
  try {
    await openEdit(id)
    if (formOpen.value) existingSearchOpen.value = false
  } finally { existingOpeningId.value = null }
}
/** Use the authenticated account from /view; never infer a user ID from a department listing. */
async function autoAssignProjectManager(): Promise<boolean> {
  try {
    await Promise.all([auth.ensureInitialized(), library.load('stakeholderTypes')])
    const userId = Number(auth.user?.id)
    if (!Number.isInteger(userId) || userId <= 0) {
      $q.notify({ type: 'warning', message: 'Your logged-in account could not be verified. Sign in again to auto-assign the Project Manager.' })
      return false
    }
    const projectManager = projectManagerRole.value
    if (!projectManager) {
      $q.notify({ type: 'warning', message: 'Project Manager is missing from the Stakeholder Type Library.' })
      return false
    }
    // Preserve a user's existing role because the current Registry payload supports only one role per user.
    const current = form.value.stakeholders.find(item => Number(item.user_id) === userId)
    if (!current) {
      form.value.stakeholders = [
        ...form.value.stakeholders,
        { user_id: userId, stakeholder_type: Number(projectManager.id) },
      ]
    } else if (Number(current.stakeholder_type) !== Number(projectManager.id)) {
      // Do not silently replace a stakeholder role on existing systems.
      $q.notify({ type: 'info', message: 'Your account already has a different stakeholder type on this system; it was preserved.' })
      return false
    }
    return true
  } catch (error) {
    $q.notify({ type: 'negative', message: `Unable to assign Project Manager: ${errorMessage(error)}` })
    return false
  }
}
function openCreate(): void {
  detailsApiRecord.value = null
  // Render the dialog immediately: do not block opening on seven library requests.
  editingId.value = null
  form.value = emptyForm()
  resetDocumentWorkspace()
  sectionSelections.value = { owner: [], office: [] }
  sectionRoles.value = { owner: null, office: null }
  formStep.value = 1
  formOpen.value = false
  profileOpen.value = true
  void loadLibraries()
  void autoAssignProjectManager()
}
async function getRecord(id: number): Promise<RegistryRecord> {
  const response = await registryApi.view(id)
  if (!response.success || !response.data) throw new Error(response.message || 'Registry not found')
  return normalizeRecord(response.data)
}
async function openView(id: number): Promise<void> {
  try {
    selected.value = await getRecord(id)
    viewOpen.value = true
  } catch (error) { $q.notify({ type: 'negative', message: errorMessage(error) }) }
}
async function openEdit(id: number): Promise<void> {
  try {
    // Loading dropdowns is independent of getting the record.
    void loadLibraries()
    const item = await getRecord(id)
    detailsApiRecord.value = item as unknown as DetailsApiRecord
    const blank = emptyForm()
    form.value = {
      ...blank,
      system_name: item.system_name,
      alias: item.alias ?? '',
      description: item.description ?? '',
      business_owner: item.business_owner ?? null,
      status: item.status,
      desc: { ...blank.desc, ...(item.desc ?? {}) },
      repo: { ...blank.repo, ...reposFromApi(item) },
      tech_stack: { ...blank.tech_stack, ...(item.tech_stack ?? {}), frontend_stack: [...(item.tech_stack?.frontend_stack ?? [])], backend_stack: [...(item.tech_stack?.backend_stack ?? [])] },
      stakeholders: (item.stakeholders ?? []).map(i => ({ user_id: i.user_id, stakeholder_type: i.stakeholder_type })),
      docs: registryDocsForEdit((item.docs ?? []).map(i => ({ docs_type: i.docs_type, file_path: i.file_path }))),
    }
    editingId.value = id
    resetDocumentWorkspace()
    // Recognize stored draft markers as pending workflow items, not uploaded files.
    form.value.docs.forEach((doc, index) => {
      if (doc.file_path?.startsWith(PENDING_DRAFT_PREFIX)) {
        documentDraftNames.value[String(index)] = `${library.labelFor('documentTypes', Number(doc.docs_type))} — Draft (content not stored)`
      }
    })
      sectionSelections.value = { owner: [], office: [] }
    sectionRoles.value = { owner: null, office: null }
    formStep.value = 1
    profileOpen.value = false
    formOpen.value = true
    // Existing systems keep their persisted stakeholders; initiation assigns PM only for new systems.
  } catch (error) { $q.notify({ type: 'negative', message: errorMessage(error) }) }
}
function optionalText(value?: string | null): string | null { return value?.trim() || null }
function payloadForSave(): RegistryPayload {
  const value = form.value
  return {
    system_name: value.system_name.trim(), alias: optionalText(value.alias), description: optionalText(value.description),
    business_owner: value.business_owner ?? null, status: value.status ?? 0,
    desc: {
      managing_type: value.desc.managing_type ?? null, managing_office: value.desc.managing_office ?? null,
      third_party_company: optionalText(value.desc.third_party_company),
      project_roll_on: value.desc.project_roll_on || null, project_sign_off: value.desc.project_sign_off || null,
      estimation_project_duration: value.desc.estimation_project_duration === null || value.desc.estimation_project_duration === undefined || String(value.desc.estimation_project_duration) === '' ? null : Number(value.desc.estimation_project_duration),
    },
    repo: value.repo.development_solution_type != null ? (
      isFullstackSolution.value ? {
        development_solution_type: value.repo.development_solution_type,
        // Backend service must persist these as two rows identified by repo_scope.
        frontend_repo_git: optionalText(value.repo.frontend_repo_git),
        frontend_staging_url: optionalText(value.repo.frontend_staging_url),
        frontend_production_url: optionalText(value.repo.frontend_production_url),
        backend_repo_git: optionalText(value.repo.backend_repo_git),
        backend_staging_url: optionalText(value.repo.backend_staging_url),
        backend_production_url: optionalText(value.repo.backend_production_url),
      } : {
        development_solution_type: value.repo.development_solution_type,
        repo_git: optionalText(value.repo.repo_git),
        staging_url: optionalText(value.repo.staging_url),
        production_url: optionalText(value.repo.production_url),
      }
    ) : null,
    tech_stack: {
      frontend_stack: value.tech_stack.frontend_stack ?? [], backend_stack: value.tech_stack.backend_stack ?? [],
      database: optionalText(value.tech_stack.database), server_type: optionalText(value.tech_stack.server_type), server_name: optionalText(value.tech_stack.server_name),
    },
    stakeholders: value.stakeholders.map(item => ({ user_id: Number(item.user_id), stakeholder_type: Number(item.stakeholder_type) })),
    docs: docsForRegistryPayload(),
  }
}
function validProfile(): boolean {
  if (!form.value.system_name.trim()) {
    $q.notify({ type: 'warning', message: 'Enter a system name before continuing.' })
    return false
  }
  if (form.value.status === null || !library.registryStatuses.some(item => Number(item.id) === Number(form.value.status))) {
    $q.notify({ type: 'warning', message: 'Select a valid Registry Status. If the list is empty, reload the Library.' })
    return false
  }
  return true
}
/** Creation happens ONCE, on System Profile. Every subsequent save updates that Registry ID. */
async function initiateSystem(): Promise<void> {
  if (saving.value || editingId.value !== null || !validProfile()) return
  saving.value = true
  try {
    // Check identity and Project Manager role before creating any backend record.
    if (!await autoAssignProjectManager()) return
    const payload = payloadForSave()
    // docsForRegistryPayload() includes BRD, SRS, SDD and User Stories as pending records.
    const response = await registryApi.create(payload)
    if (!response.success) throw new Error(response.message || 'Unable to initiate system')

    const createdId = Number(response.data?.id)
    if (!Number.isSafeInteger(createdId) || createdId <= 0) {
      // The POST may already have succeeded. Never repeat it automatically, or users risk duplicate IS records.
      profileOpen.value = false
      $q.notify({ type: 'warning', timeout: 9000, message: 'System was created, but the API did not return its ID. Find it in Existing Information Systems to continue; do not click Initiate again.' })
      await loadRegistries()
      return
    }
    editingId.value = createdId
    detailsApiRecord.value = (response.data ?? { id: createdId }) as DetailsApiRecord
    // Refresh the server-generated relation details and timestamps without blocking the modal.
    void getRecord(createdId).then(record => {
      if (editingId.value === createdId) detailsApiRecord.value = record as unknown as DetailsApiRecord
    }).catch(() => { /* The editable form remains available if this read fails. */ })
    formStep.value = 2
    profileOpen.value = false
    formOpen.value = true
    $q.notify({ type: 'positive', message: `System initiated (#${createdId}). Project Manager and four initial document records were submitted.` })
    await loadRegistries()
  } catch (error) {
    $q.notify({ type: 'negative', message: `Unable to initiate system: ${errorMessage(error)}` })
  } finally {
    saving.value = false
  }
}
function goToStep(target: number): void {
  if (saving.value || target < 1 || target > stepLabels.length || target === formStep.value) return
  if (target > 1 && editingId.value === null) {
    $q.notify({ type: 'warning', message: 'Click Initiate on System Profile to create this system before continuing.' })
    formStep.value = 1
    return
  }
  if (target > 1 && !validProfile()) { formStep.value = 1; return }
  formStep.value = target
}
function nextStep(): void {
  goToStep(formStep.value + 1)
}
async function saveSystem(): Promise<void> {
  if (saving.value) return
  if (!form.value.system_name.trim() || form.value.status === null ||
      !library.registryStatuses.some(item => Number(item.id) === Number(form.value.status))) {
    formStep.value = 1
    $q.notify({ type: 'warning', message: 'Complete the required System Profile fields.' })
    return
  }
  if (editingId.value === null) {
    $q.notify({ type: 'warning', message: 'Initiate the system from the Details / System Profile step first.' })
    formStep.value = 1
    return
  }
  saving.value = true
  try {
    if (form.value.stakeholders.some(item => !item.stakeholder_type || !library.stakeholderTypes.some(t => Number(t.id) === Number(item.stakeholder_type)))) {
      formStep.value = 4
      $q.notify({ type: 'warning', message: 'Assign a valid stakeholder role to every selected user.' })
      return
    }
    const payload = payloadForSave()
    const response = await registryApi.update(editingId.value, payload)
    if (!response.success) throw new Error(response.message || 'Failed to update registry')
    formOpen.value = false
    $q.notify({ type: 'positive', message: 'System updated successfully.' })
    $q.notify({ type: 'info', timeout: 6500, message: 'Document records have been saved. Pending paths are placeholders; files, draft contents, and task assignments are not uploaded or stored.' })
    await loadRegistries()
  } catch (error) { $q.notify({ type: 'negative', message: errorMessage(error) }) }
  finally { saving.value = false }
}
function confirmDelete(item: RegistryRecord): void {
  $q.dialog({ title: 'Permanently delete system?', message: `Delete ${item.system_name} and its related records? This cannot be undone.`, cancel: true, persistent: true })
    .onOk(() => { void deleteSystem(item.id) })
}
async function deleteSystem(id: number): Promise<void> {
  try {
    const response = await registryApi.delete(id)
    if (!response.success) throw new Error(response.message || 'Unable to delete system')
    $q.notify({ type: 'positive', message: 'System deleted successfully.' })
    await loadRegistries()
  } catch (error) { $q.notify({ type: 'negative', message: errorMessage(error) }) }
}

onMounted(() => {
  // Registry list is its own request. Only load two libraries required for table labels.
  // Defer the other seven dropdown libraries until a user opens the registration form.
  void loadRegistries()
  void Promise.allSettled([library.load('departments'), library.load('registryStatuses')])
})
</script>

<style scoped lang="scss">
/* Registration wizard: interactive, compact, responsive cards */
.registry-wizard-header{display:flex;align-items:center;gap:15px;padding:22px 26px;background:linear-gradient(112deg,#f3f4ff,#fff 65%)}
.registry-wizard-header__icon{display:grid;place-items:center;width:52px;height:52px;border-radius:15px;flex-shrink:0;background:#e5e7ff;color:#2e3092}
.registry-wizard-header__copy{flex:1;min-width:0}
.registry-wizard-steps{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px;margin:0 0 20px}
.registry-wizard-step{display:flex;align-items:center;text-align:left;gap:10px;padding:13px 10px;background:#f6f7fb;border:1px solid #e3e6f0;border-radius:12px;color:#67738f;font-size:12px;font-weight:750;min-width:0;cursor:pointer;transition:background .16s,border-color .16s,box-shadow .16s;font-family:inherit}
.registry-wizard-step:hover:not(:disabled){background:#ebedff;border-color:#a6a9e5}
.registry-wizard-step:focus-visible{outline:3px solid #9c9ff0;outline-offset:2px}
.registry-wizard-step:disabled{opacity:.55;cursor:not-allowed}
.registry-wizard-step__label{line-height:1.35;flex:1;min-width:0}
.registry-wizard-step__arrow{flex:none}
.registry-wizard-step.is-current{background:#eeefff;border-color:#494ba9;color:#282b89;box-shadow:0 0 0 1px #494ba9 inset}
.registry-wizard-step.is-complete{color:#3f449b;border-color:#d3d6ef;background:#f8f8ff}
.registry-wizard-content{display:flex;flex-direction:column;gap:12px;min-height:215px}
@media(max-width:700px){.registry-wizard-steps{grid-template-columns:repeat(2,minmax(0,1fr))}.registry-wizard-header{padding:15px}.registry-wizard-header__icon{width:42px;height:42px}.registry-wizard-step{padding:10px 8px}}

/* Registry editor visual refresh — ONE ICTMS palette, no change to form logic. */
.registry-dialog--editor{
  width:min(1220px,96vw)!important;
  max-width:1220px!important;
  height:min(880px,93dvh);
  max-height:93dvh;
  border-radius:20px;
  box-shadow:0 26px 90px rgba(27,39,92,.20);
}
.registry-dialog--editor .registry-wizard-header{
  gap:17px;
  padding:22px 30px;
  background:#fff;
  border-bottom:1px solid #edf0f7;
}
.registry-dialog--editor .registry-wizard-header__icon{
  width:51px;height:51px;border-radius:15px;
  background:#eef0ff;color:#373ca6;
  display:grid;place-items:center;flex:none;
}
.registry-wizard-header__copy{min-width:0;flex:1}
.registry-wizard-header__eyebrow{font-size:10px;letter-spacing:.12em;font-weight:800;color:#777fb4;margin-bottom:3px}
.registry-wizard-header__subtitle{margin:4px 0 0;color:#7784a3;font-size:12px;line-height:1.45}
.registry-dialog--editor .registry-wizard-header__copy .text-h6{font-size:21px;line-height:1.3;color:#202653;letter-spacing:-.025em}
.registry-dialog--editor .registry-wizard-header__aside .q-btn{color:#4a567e;background:#f6f7fc}
.registry-wizard-progress{height:3px;background:#eff1fc}
.registry-wizard-progress__fill{background:#4648bd}
.registry-wizard-layout{grid-template-columns:226px minmax(0,1fr)}
.registry-wizard-sidebar{background:#f8f9fd;border-right:1px solid #e9edf6;padding:20px 12px;gap:13px}
.registry-dialog--editor .registry-wizard-steps{gap:5px}
.registry-dialog--editor .registry-wizard-step{
  min-height:47px;padding:10px 14px;
  font-size:12px;border-radius:10px;color:#65708e;
  transition:background .16s,border-color .16s;
}
.registry-dialog--editor .registry-wizard-step:hover:not(:disabled){transform:none;background:#eff0fc;border-color:#e1e4fa}
.registry-dialog--editor .registry-wizard-step.is-current{
  color:#343ca0;background:#e9ebff;border-color:#cbd0ff;
  box-shadow:none;position:relative;
}
.registry-dialog--editor .registry-wizard-step.is-current::before{
  content:'';position:absolute;left:0;top:11px;bottom:11px;width:3px;
  background:#494cc4;border-radius:0 3px 3px 0;
}
.registry-dialog--editor .registry-wizard-step.is-complete{
  background:transparent;color:#66738f;border-color:transparent;
}
.registry-dialog--editor .registry-wizard-main{
  padding:29px clamp(22px,3vw,44px) 38px;
  background:#fbfcff;
}
.registry-dialog--editor .registry-details-view{gap:18px;padding-bottom:20px}
.registry-details-section--unboxed{display:flex;flex-direction:column;gap:16px}
.registry-overview-block,
.registry-overview-block:first-of-type{
  border:1px solid #e3e8f5;
  background:#fff;
  border-radius:15px;
  padding:21px 23px;
  margin:0;
  box-shadow:0 3px 12px rgba(30,47,105,.025);
}
.registry-overview-block__heading{gap:10px;margin-bottom:18px;color:#464ab2}
.registry-overview-block__heading h5{font-size:14px;color:#222958;font-weight:800}
.registry-details-section__fields{column-gap:36px;row-gap:21px}
.registry-details-readonly__item{padding:0}
.registry-details-readonly__item dt{font-size:11px;color:#8491ac;margin-bottom:7px;letter-spacing:0}
.registry-details-readonly__item dd{font-size:13px;color:#242b62;line-height:1.5}
.registry-details-readonly__item--prominent dd{font-size:24px;line-height:1.3}
.registry-overview-list__row{padding:12px 0}
.registry-wizard-footer{border-top:1px solid #e9edf7;background:#fff;min-height:70px;padding:12px 24px!important}
.registry-wizard-footer .q-btn{min-height:41px;border-radius:9px}
@media(max-width:900px){
  .registry-wizard-layout{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr)}
  .registry-dialog--editor .registry-wizard-header{padding:16px 21px}
  .registry-dialog--editor .registry-wizard-main{padding:22px}
  .registry-wizard-sidebar{padding:10px 15px;gap:5px}
}
@media(max-width:600px){
  .registry-dialog--editor{width:100vw!important;max-width:100vw!important;height:100dvh;max-height:100dvh;border-radius:0}
  .registry-dialog--editor .registry-wizard-header{padding:12px 15px;gap:11px}
  .registry-dialog--editor .registry-wizard-header__icon{width:40px;height:40px;border-radius:11px}
  .registry-wizard-header__subtitle{display:none}
  .registry-dialog--editor .registry-wizard-main{padding:15px}
  .registry-overview-block,.registry-overview-block:first-of-type{padding:17px 15px;border-radius:12px}
  .registry-details-section__fields{grid-template-columns:1fr;gap:16px}
  .registry-wizard-footer{padding:10px!important}
}
</style>

<style scoped lang="scss">
.registry-page{color:#202558;max-width:1600px;margin:0 auto;padding-top:48px;padding-bottom:55px}.registry-heading{margin-bottom:26px}.registry-heading h1{font-size:clamp(2.2rem,3.3vw,3.35rem);line-height:1.08;font-weight:850;letter-spacing:-.055em;margin:13px 0 8px;color:#222560}.registry-heading p,.registry-panel__heading p{color:#8493b6;font-size:15px;margin:0}.registry-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:26px}.registry-stat{background:#fff;border:1px solid #dfe4f1;border-radius:18px;padding:21px 22px;min-width:0;min-height:160px;box-shadow:0 8px 22px rgba(36,48,101,.025)}.registry-stat__top{display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:850;letter-spacing:.095em;color:#3432af}.registry-stat__body{display:flex;align-items:center;gap:19px;margin-top:19px}.registry-stat__icon{display:grid;place-items:center;flex-shrink:0;width:66px;height:66px;border-radius:20px;background:#eef0ff;color:#3236c4}.registry-stat strong{font-size:37px;line-height:1;font-weight:850;color:#20245f;letter-spacing:-.06em}.registry-stat p{color:#8b9abc;margin:5px 0 0;font-size:12px;line-height:1.35}.registry-stat--active .registry-stat__top,.registry-stat--active .registry-stat__icon{color:#009a65}.registry-stat--active .registry-stat__icon{background:#e5f8f0}.registry-stat--review .registry-stat__top,.registry-stat--review .registry-stat__icon{color:#cb7800}.registry-stat--review .registry-stat__icon{background:#fff5db}.registry-stat--archived .registry-stat__top,.registry-stat--archived .registry-stat__icon{color:#d21d37}.registry-stat--archived .registry-stat__icon{background:#fff0f2}.registry-panel{background:white;border:1px solid #dfe5f2;border-radius:19px;padding:20px;box-shadow:0 12px 35px rgba(30,46,100,.03)}.registry-panel__heading{display:flex;gap:20px;justify-content:space-between;align-items:center;margin-bottom:18px}.registry-panel__heading h2{color:#1c225b;font-size:24px;line-height:1.2;font-weight:850;letter-spacing:-.045em;margin:0 0 5px}.registry-actions{display:flex;align-items:center;gap:12px}.registry-search{width:290px;max-width:32vw}.registry-filter{color:#262d82;border-color:#e2e6f0;height:40px;padding-inline:12px}.registry-add{background:#2d2bb0;color:#fff;border-radius:9px;height:40px;padding:0 18px;font-weight:750}.registry-table{color:#3b4c7f}.registry-table :deep(thead tr){background:#f0f3f9}.registry-table :deep(th){color:#60749e;font-weight:850;font-size:10px;letter-spacing:.09em;white-space:nowrap;padding-top:15px;padding-bottom:15px}.registry-table :deep(td){border-color:#edf0f6;padding-top:10px;padding-bottom:10px;font-size:12px}.registry-system-cell{display:flex;align-items:center;gap:14px;min-width:260px;text-align:left}.registry-system-icon{height:40px;width:40px;flex-shrink:0;border-radius:9px;display:grid;place-items:center}.registry-system-cell strong{display:block;font-size:12px;color:#171c59;font-weight:800;white-space:normal}.registry-system-cell small,.registry-updated small{display:block;color:#8498bc;font-size:11px;margin-top:3px}.registry-pill{display:inline-flex;align-items:center;white-space:nowrap;border-radius:9px;font-size:11px;padding:6px 10px}.registry-pill--category{background:#eaf0ff;color:#3245c5}.registry-pill--category.is-hr{background:#ffebee;color:#c92a43}.registry-pill--category.is-finance{background:#fff4df;color:#b77900}.registry-pill--category.is-procurement{background:#efebff;color:#6842ca}.registry-pill--category.is-assets{background:#e9edf3;color:#657590}.registry-pill--status{gap:9px;background:#e7f7ef;color:#09865e}.registry-pill--status.is-review{background:#fff5dd;color:#c17900}.registry-pill--status.is-archived{background:#ffecf0;color:#c62743}.registry-pill__dot{height:9px;width:9px;border-radius:50%;background:currentColor}.registry-updated{font-size:12px;color:#364b7d;white-space:nowrap}.registry-dialog{width:min(700px,96vw);max-width:700px;border-radius:19px}.registry-form{display:flex;flex-direction:column;gap:8px;padding-top:24px}.registry-form__grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.registry-details h3{font-size:21px;font-weight:800;margin:0 0 10px}.registry-details p{color:#687797}.registry-details dl{display:grid;grid-template-columns:140px 1fr;gap:12px;margin:20px 0}.registry-details dt{color:#8793b2}.registry-details dd{margin:0;font-weight:600;overflow-wrap:anywhere}
@media(max-width:1200px){.registry-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.registry-panel__heading{align-items:flex-start;flex-direction:column}.registry-search{width:300px;max-width:100%}}
@media(max-width:700px){.registry-page{padding-top:26px}.registry-stats{gap:10px}.registry-stat{padding:14px;min-height:132px}.registry-stat__body{gap:10px}.registry-stat__icon{height:46px;width:46px;border-radius:13px}.registry-stat strong{font-size:30px}.registry-stat__top{font-size:10px}.registry-stat p{font-size:11px}.registry-panel{padding:12px}.registry-actions{width:100%;flex-wrap:wrap}.registry-search{width:100%;max-width:none;flex:1 1 100%}.registry-form__grid{grid-template-columns:1fr}}

.registry-dialog--wide{width:min(900px,96vw);max-width:900px}.registry-form--scroll{max-height:65vh;overflow-y:auto}.registry-group-title{font-weight:800;font-size:14px;color:#252c7c;margin:16px 0 8px;padding-bottom:8px;border-bottom:1px solid #e7eaf2}.registry-inline-row{align-items:start}
</style>


<style scoped>
.registry-stakeholder-toolbar{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.registry-stakeholder-sources{display:flex;flex-wrap:wrap;gap:6px;align-items:center;flex:1 1 250px;min-width:0}
.registry-stakeholder-search{flex:1 1 240px;min-width:180px}
.registry-stakeholder-list{border:1px solid #e1e5ef;border-radius:12px;overflow:hidden;max-height:345px;overflow-y:auto;background:white}
.registry-stakeholder-item{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid #edf0f6}
.registry-stakeholder-item:last-child{border-bottom:0}
.registry-stakeholder-person{flex:1 1 180px;min-width:0;display:flex;flex-direction:column;gap:2px}
.registry-stakeholder-person strong{font-size:13px;color:#232867;overflow-wrap:anywhere}
.registry-stakeholder-person span{font-size:11px;color:#7d89a0;overflow-wrap:anywhere}
.registry-stakeholder-office{color:#4b5994!important}
.registry-stakeholder-role{width:210px;flex:none;text-align:left}
.registry-stakeholder-empty{padding:25px;text-align:center;color:#7d89a0;background:#f8f9fd;border:1px dashed #d8ddec;border-radius:12px}
@media(max-width:620px){.registry-stakeholder-item{flex-wrap:wrap}.registry-stakeholder-role{width:100%;flex:1 1 100%}}

/* Details tab only: structured, compact and readable in the existing editor modal. */
.registry-dialog--editor .registry-details-view{gap:20px;min-height:0;padding-bottom:12px}
.registry-details-section{border:1px solid #e5e9f3;border-radius:16px;padding:20px 22px 23px;background:#fff;box-shadow:0 2px 10px rgba(23,38,86,.025)}
.registry-details-section--unboxed{border:0;border-radius:0;padding:0;background:transparent;box-shadow:none}
.registry-details-section__header{display:flex;align-items:flex-start;gap:12px;margin-bottom:19px}
.registry-details-section__number{display:grid;place-items:center;width:31px;height:31px;flex:none;border-radius:9px;background:#f0f2ff;color:#414dab;font-size:11px;font-weight:900}
.registry-details-section__header h4{margin:1px 0 4px;font-size:14px;font-weight:800;color:#232b5a;line-height:1.35}
.registry-details-section__header p{margin:0;font-size:12px;color:#8190a7;line-height:1.45}
.registry-details-section__fields{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;align-items:start}
.registry-details-section__fields > .q-field,.registry-details-section__description{min-width:0;width:100%}
.registry-details-section__description textarea{min-height:74px}
.registry-details-readonly{margin:0;padding:0;list-style:none}
.registry-details-readonly__item{min-width:0;padding:4px 0;background:transparent;border:0;border-radius:0}
.registry-details-readonly__item--wide{grid-column:1 / -1}
.registry-details-readonly__description-value{white-space:pre-wrap;font-weight:500!important}
.registry-details-readonly__item dt{font-size:11px;letter-spacing:.02em;color:#8390ad;font-weight:700;margin:0 0 7px}
.registry-details-readonly__item dd{margin:0;color:#232a5e;font-size:14px;font-weight:700;line-height:1.55;overflow-wrap:anywhere}
.registry-details-readonly__item--prominent dd{font-size:24px;font-weight:800;line-height:1.3;letter-spacing:-.025em;color:#20285b}
.registry-details-readonly__item--prominent dt{font-size:12px;margin-bottom:8px}
.registry-details-readonly__status{display:inline-flex;align-items:center;padding:5px 11px;border-radius:9px;background:#e8f6ee;color:#16805a;font-size:12px;font-weight:800}
.registry-details-readonly__status.is-review{background:#fff4dd;color:#a86b00}
.registry-details-readonly__status.is-archived{background:#fff0f3;color:#c13650}
.registry-details-readonly__description{padding:16px 18px;background:#f8faff;border:1px solid #edf0f8;border-radius:12px;white-space:pre-wrap;overflow-wrap:anywhere;color:#313b6c;line-height:1.7;font-size:14px}
@media(max-width:700px){.registry-details-section{padding:16px}.registry-details-section__fields{grid-template-columns:1fr;gap:14px}}

.registry-overview-block{border-top:1px solid #e8edf5;padding-top:21px;margin-top:23px}
.registry-overview-block:first-of-type{border-top:0;margin-top:0;padding-top:0}
.registry-overview-block__heading{display:flex;align-items:center;gap:9px;margin-bottom:14px;color:#3949a5}
.registry-overview-block__heading h5{margin:0;color:#273164;font-size:14px;font-weight:800}
.registry-overview-count{margin-left:auto;font-size:11px;color:#697795;background:#f1f4fb;border-radius:9px;padding:5px 9px}
.registry-overview-list{border:0;border-radius:0;overflow:visible}
.registry-overview-list__row{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:12px 0;border-bottom:1px solid #edf0f6}
.registry-overview-list__row:last-child{border-bottom:0}
.registry-overview-list__main{min-width:0;display:flex;flex-direction:column;gap:4px;overflow-wrap:anywhere}
.registry-overview-list__main strong{font-size:13px;color:#273164}
.registry-overview-list__main span,.registry-overview-list__meta{font-size:12px;color:#667490;overflow-wrap:anywhere}
.registry-overview-list__meta{flex:none}
.registry-overview-empty{padding:10px 0;border:0;border-radius:0;font-size:12px;color:#78849d}
@media(max-width:620px){.registry-overview-list__row{align-items:flex-start;flex-direction:column}.registry-overview-list__meta{flex:auto}}

</style>

<style scoped>
.registry-assign-panel{border:1px solid #dfe4f1;border-radius:13px;overflow:hidden;background:#fff}
.registry-assign-panel__head{display:flex;justify-content:space-between;gap:12px;align-items:start;padding:16px;background:#f7f8fe}
.registry-assign-panel__head strong{color:#242766;font-size:15px}
.registry-assign-panel__head p{font-size:12px;color:#687797;margin:5px 0 0}
.registry-assign-controls{display:flex;align-items:center;gap:12px;padding:13px 16px;border-top:1px solid #e9edf5;border-bottom:1px solid #e9edf5}
.registry-assign-type{flex:1 1 260px;min-width:0}
.registry-department-groups{padding:12px;display:flex;flex-direction:column;gap:12px;max-height:340px;overflow-y:auto}
.registry-department-group{border:1px solid #e6eaf5;border-radius:10px;overflow:hidden}
.registry-department-group__header{display:flex;align-items:center;justify-content:space-between;background:#f5f7fc;padding:9px 13px;gap:10px}
.registry-department-group__header strong{display:block;font-size:13px;color:#303477}
.registry-department-group__header span{font-size:11px;color:#7a859b}
.registry-department-group__empty{padding:14px;color:#7a859b;font-size:12px}
.registry-assigned-groups{display:flex;flex-direction:column;gap:10px}
.registry-assigned-group{border:1px solid #dfe4f1;border-radius:11px;overflow:hidden}
.registry-assigned-group__header{background:#eef0ff;padding:9px 14px;display:flex;align-items:center;gap:9px;justify-content:space-between;color:#282d83}
.registry-assigned-user{padding:7px 13px;display:flex;gap:10px;align-items:center;border-top:1px solid #eef0f7;font-size:12px;color:#37466b}
.registry-assigned-user span{flex:1;min-width:0;overflow-wrap:anywhere}
@media(max-width:620px){.registry-assign-controls{flex-wrap:wrap}.registry-assign-controls>.q-btn{width:100%}}
</style>

<style scoped>
.registry-stakeholder-section{border:1px solid #dde4f4;border-radius:12px;padding:12px;background:#fff}
.registry-stakeholder-section__title{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}
.registry-stakeholder-section__title strong{font-size:15px;color:#222764}
.registry-stakeholder-section .registry-stakeholder-list{max-height:280px;overflow-y:auto}
</style>

<style scoped lang="scss">
/* Spacious, responsive Registry editor */
.registry-dialog--editor{width:min(1280px,97vw)!important;max-width:1280px!important;height:min(900px,94vh);max-height:94vh;display:flex;flex-direction:column;overflow:hidden;border-radius:22px;box-shadow:0 28px 90px rgba(27,35,90,.22)}
.registry-dialog--editor .registry-wizard-header{flex-shrink:0;padding:22px 30px;background:linear-gradient(118deg,#f0f2ff 0%,#fff 72%);border-bottom:1px solid #e7eaf7}
.registry-wizard-header__aside{display:flex;align-items:center;gap:12px;flex-shrink:0}
.registry-wizard-counter{color:#4046a0;background:#e9ebff;padding:8px 13px;font-size:12px;font-weight:800;border-radius:99px;white-space:nowrap}
.registry-wizard-progress{height:4px;background:#eef0fa;flex-shrink:0;overflow:hidden}
.registry-wizard-progress__fill{height:100%;background:linear-gradient(90deg,#4548bc,#7b6ee4);border-radius:0 4px 4px 0;transition:width .25s ease}
.registry-wizard-form{display:flex;flex-direction:column;flex:1;min-height:0}
.registry-wizard-layout{display:grid;grid-template-columns:250px minmax(0,1fr);flex:1;min-height:0}
.registry-wizard-sidebar{display:flex;flex-direction:column;gap:16px;background:#f7f8fd;border-right:1px solid #e7eaf5;padding:26px 16px 20px;min-height:0;overflow:auto}
.registry-sidebar-title{padding:0 12px;color:#8993b0;letter-spacing:.12em;font-weight:850;font-size:10px}
.registry-dialog--editor .registry-wizard-steps{display:flex;flex-direction:column;gap:7px;margin:0}
.registry-dialog--editor .registry-wizard-step{width:100%;min-height:53px;border-radius:12px;padding:11px 12px;background:transparent;border:1px solid transparent;color:#626f8c;font-weight:700;font-size:13px;gap:11px}
.registry-dialog--editor .registry-wizard-step:hover:not(:disabled){background:#eceeff;border-color:#dcdff7;transform:translateX(2px)}
.registry-dialog--editor .registry-wizard-step.is-current{background:#e8eaff;border-color:#bfc4f6;color:#34359d;box-shadow:0 3px 12px rgba(63,70,158,.08)}
.registry-dialog--editor .registry-wizard-step.is-complete{background:#f0f7f6;color:#347266;border-color:transparent}
.registry-sidebar-hint{margin-top:auto;display:flex;align-items:flex-start;gap:10px;background:#fff;border:1px solid #e7eafa;color:#7d89a3;padding:13px;border-radius:13px;font-size:11px;line-height:1.5}
.registry-sidebar-hint .q-icon{color:#7476c6;flex:none}
.registry-dialog--editor .registry-wizard-main{padding:26px clamp(22px,3.1vw,48px) 40px;max-height:none;min-height:0;overflow-y:auto;overscroll-behavior:contain;gap:16px;background:#fff}
.registry-wizard-section-meta{display:flex;justify-content:space-between;align-items:center;font-size:11px;letter-spacing:.06em;font-weight:850;text-transform:uppercase;color:#808ba6}
.registry-wizard-section-meta span:last-child{letter-spacing:0;background:#f0f1fa;color:#565ba9;padding:6px 10px;border-radius:8px}
.registry-dialog--editor .registry-wizard-content{gap:19px;min-height:270px}
.registry-dialog--editor .registry-form__grid{gap:16px}
/* System Profile: evenly spaced controls without Quasar's unused validation-footer height. */
.registry-dialog--editor .registry-profile-fields{gap:18px}
.registry-dialog--editor .registry-profile-fields__row{gap:18px;align-items:start}
.registry-dialog--editor .registry-profile-fields > .q-field,
.registry-dialog--editor .registry-profile-fields__row > .q-field{min-width:0;width:100%}

.registry-wizard-footer{background:white;flex-shrink:0;min-height:77px;gap:12px;padding:14px 25px!important}
.registry-wizard-footer .q-btn{border-radius:10px;min-height:42px;padding-left:17px;padding-right:17px}
@media(max-width:900px){.registry-wizard-layout{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr)}.registry-wizard-sidebar{padding:12px 16px;overflow:visible;gap:6px}.registry-sidebar-title,.registry-sidebar-hint{display:none}.registry-dialog--editor .registry-wizard-steps{display:flex;flex-direction:row;overflow-x:auto;gap:7px;padding:3px 1px 6px}.registry-dialog--editor .registry-wizard-step{width:auto;white-space:nowrap;flex:none;min-height:44px;padding:8px 10px}.registry-wizard-step__number{width:26px;height:26px}.registry-dialog--editor .registry-wizard-main{padding:22px}.registry-dialog--editor .registry-wizard-header{padding:16px 20px}}
@media(max-width:600px){.registry-dialog--editor{width:100vw!important;max-width:100vw!important;height:100dvh;max-height:100dvh;border-radius:0}.registry-wizard-counter{display:none}.registry-wizard-header__copy .text-caption{display:none}.registry-dialog--editor .registry-wizard-header{gap:10px;padding:14px}.registry-dialog--editor .registry-wizard-main{padding:16px}.registry-dialog--editor .registry-form__grid{grid-template-columns:1fr}.registry-wizard-footer{flex-wrap:wrap;padding:10px!important;gap:5px;min-height:66px}.registry-wizard-footer .q-btn{padding:0 10px}.registry-footer-current{display:none}.registry-dialog--editor .registry-wizard-intro{padding:14px}.registry-dialog--editor .registry-wizard-intro > .q-icon{padding:7px}}
</style>

<style scoped>
.registry-choice-dialog{width:min(590px,94vw);max-width:590px;border-radius:18px}
.registry-choice-options{display:grid;gap:13px;padding:8px 22px 24px}
.registry-choice-option{display:flex;align-items:center;text-align:left;gap:15px;width:100%;padding:20px;border:1px solid #e3e7fa;border-radius:14px;background:#fafbff;color:#30386e;cursor:pointer;transition:background .18s,border-color .18s,transform .18s}
.registry-choice-option:hover,.registry-choice-option:focus-visible{background:#eff1ff;border-color:#898fe5;transform:translateY(-1px)}
.registry-choice-option span{display:grid;flex:1;gap:5px}
.registry-choice-option strong{font-size:15px}
.registry-choice-option small{color:#72809c;font-size:12px}
.registry-existing-dialog{width:min(740px,96vw);max-width:740px;border-radius:18px}
.registry-existing-results{max-height:min(440px,50vh);overflow-y:auto;padding-top:0}
</style>

<style scoped>
.registry-documents{display:flex;flex-direction:column;gap:16px}
.registry-documents-empty{display:flex;gap:10px;align-items:center;padding:22px;border:1px dashed #cfd6ec;border-radius:12px;background:#f8f9fe;color:#65708e}
.registry-document-assign-dialog{width:min(520px,94vw);border-radius:16px}
</style>

<style scoped>
/* System Profile registration dialog – redesigned presentation only. */
.registry-profile-init-dialog{width:min(860px,95vw);max-width:860px;border-radius:20px;overflow:hidden;background:#f7f9fd;color:#192d56}
.registry-profile-init-header{display:flex;align-items:center;gap:16px;padding:24px 28px;background:linear-gradient(115deg,#092c73 0%,#0038a8 68%,#285fbe 100%);color:white}
.registry-profile-init-icon{display:grid;place-items:center;flex:0 0 52px;height:52px;border-radius:15px;background:rgba(255,255,255,.15);color:white;border:1px solid rgba(255,255,255,.21)}
.registry-profile-init-heading{min-width:0;flex:1}
.registry-profile-init-eyebrow{font-size:10px;font-weight:800;letter-spacing:.15em;color:#c5d8ff;margin-bottom:5px}
.registry-profile-init-heading h2{font-size:21px;font-weight:800;line-height:1.25;margin:0;color:white}
.registry-profile-init-heading p{margin:6px 0 0;font-size:12px;color:#deebff;line-height:1.45}
.registry-profile-init-close{color:white;align-self:flex-start;margin:-5px -8px 0 0}
.registry-profile-init-fields{display:flex;flex-direction:column;gap:16px;padding:20px 24px 24px;max-height:calc(90vh - 177px);overflow-y:auto}
.registry-profile-init-panel{background:#fff;border:1px solid #e0e8f4;border-radius:15px;padding:22px 22px 24px;box-shadow:0 4px 16px rgba(18,49,105,.035)}
.registry-profile-init-section-heading{display:flex;align-items:center;gap:12px;margin-bottom:19px}
.registry-profile-init-section-heading h3{font-size:15px;line-height:1.35;margin:0;font-weight:800;color:#142f69}
.registry-profile-init-section-heading p{font-size:12px;line-height:1.4;margin:3px 0 0;color:#687b9c}
.registry-profile-init-required-hint{font-size:11px;color:#7b89a5;margin-left:auto;white-space:nowrap;align-self:flex-start}
.registry-profile-init-inputs{display:flex;flex-direction:column;gap:14px}
.registry-profile-init-inputs :deep(.q-field--outlined .q-field__control){border-radius:9px}
.registry-profile-init-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.registry-profile-init-description :deep(textarea){min-height:50px!important}
.registry-profile-init-panel--architecture{padding-bottom:22px}
.registry-profile-init-solution-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}
.registry-profile-init-solution{appearance:none;position:relative;min-height:100px;min-width:0;border:1.5px solid #dbe5f4;border-radius:12px;background:#fbfcff;color:#2b477c;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:10px;padding:14px 12px;cursor:pointer;text-align:left;transition:background .18s,border-color .18s,box-shadow .18s,transform .18s;font:inherit}
.registry-profile-init-solution:hover{border-color:#82a6eb;background:#f3f7ff;transform:translateY(-1px)}
.registry-profile-init-solution:focus-visible{outline:3px solid #93b9fb;outline-offset:2px}
.registry-profile-init-solution.is-selected{background:#edf4ff;border-color:#0038a8;box-shadow:0 0 0 1px #0038a8 inset}
.registry-profile-init-solution-icon{display:grid;place-items:center;width:36px;height:36px;border-radius:10px;background:#edf2fb;color:#315896}
.registry-profile-init-solution.is-selected .registry-profile-init-solution-icon{background:#0038a8;color:#fff}
.registry-profile-init-solution-name{font-size:11px;line-height:1.35;letter-spacing:.025em;font-weight:800;overflow-wrap:anywhere}
.registry-profile-init-footer{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 24px;background:white}
.registry-profile-init-footer-note{display:flex;align-items:center;gap:7px;color:#71809b;font-size:11px;line-height:1.4;max-width:330px}
.registry-profile-init-footer-actions{display:flex;gap:8px;align-items:center;margin-left:auto}
.registry-profile-init-submit{border-radius:9px;padding:0 14px;min-height:41px;background:#0038a8!important;font-weight:700}
@media(max-width:760px){.registry-profile-init-solution-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.registry-profile-init-footer-note{display:none}}
@media(max-width:600px){.registry-profile-init-dialog{width:100vw;max-width:100vw;border-radius:0}.registry-profile-init-grid{grid-template-columns:1fr}.registry-profile-init-fields{padding:14px;gap:12px}.registry-profile-init-header{padding:17px}.registry-profile-init-panel{padding:16px}.registry-profile-init-solution-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.registry-profile-init-solution{min-height:82px}.registry-profile-init-footer{padding:12px 16px}.registry-profile-init-heading h2{font-size:17px}.registry-profile-init-icon{height:43px;flex-basis:43px}}
</style>

<style scoped lang="scss">
/* 2026 registry visual system: presentation only; existing state and APIs unchanged */
.registry-page.workspace-page {
  width:100%; max-width:1560px; padding:36px clamp(18px,3.3vw,56px) 64px;
  color:#18244e;
}
.registry-heading {
  display:flex; align-items:center; justify-content:space-between; gap:24px;
  padding:0 0 28px; margin-bottom:22px;
}
.registry-heading__main { display:flex; align-items:center; min-width:0; gap:18px; }
.registry-heading__icon {
  width:58px; height:58px; flex:0 0 58px; display:grid;place-items:center;
  color:#4338ca; background:linear-gradient(145deg,#e9eaff,#f2f5ff);
  border:1px solid #e1e5fa; border-radius:18px;
  box-shadow:0 7px 20px rgba(70,68,173,.06);
}
.registry-heading__copy { min-width:0; }
.registry-heading .section-kicker { font-size:10px; letter-spacing:.12em; font-weight:800; color:#6068a8; }
.registry-heading__crumb { color:#b4bcce; margin:0 5px; }
.registry-heading h1 {
  font-size:clamp(27px,2.6vw,39px); line-height:1.17;
  letter-spacing:-.042em; font-weight:800; margin:7px 0 5px; color:#192452;
}
.registry-heading p { margin:0; color:#7c8aa5; font-size:13px; line-height:1.55; }
.registry-heading__right { display:flex;gap:16px;align-items:center;flex:none; }
.registry-live-indicator {
  display:inline-flex;align-items:center;gap:8px;white-space:nowrap;
  font-size:11px;font-weight:700;color:#427c68;
  padding:8px 11px;background:#eff9f4;border:1px solid #daf0e5;border-radius:99px;
}
.registry-live-indicator__dot {height:7px;width:7px;border-radius:50%;background:#24b47e;box-shadow:0 0 0 3px #dcf5e9;}
.registry-heading .registry-add {
  min-height:43px; height:43px; border-radius:12px; font-size:12px;
  padding:0 19px; font-weight:750;
  background:linear-gradient(110deg,#3733a7,#5149c9);
  box-shadow:0 7px 17px rgba(56,55,173,.17);
}
.registry-stats {gap:15px;margin-bottom:23px;}
.registry-stat {
  position:relative; overflow:hidden; min-height:137px; padding:19px 19px 17px;
  border-radius:16px; border-color:#e4e9f2;
  box-shadow:0 7px 24px rgba(27,39,87,.035);
  transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease;
}
.registry-stat:hover {transform:translateY(-2px);border-color:#cfd5f0;box-shadow:0 11px 30px rgba(27,39,87,.065);}
.registry-stat__top {letter-spacing:.065em;font-size:10px;color:#7481a0;}
.registry-stat__top > .q-icon {opacity:.5;font-size:17px!important;}
.registry-stat__body {gap:15px;margin-top:14px;}
.registry-stat__icon {height:51px;width:51px;border-radius:14px;}
.registry-stat__icon .q-icon {font-size:25px!important;}
.registry-stat strong {font-size:33px;font-weight:800;}
.registry-stat p {font-size:11px;color:#8792a9;}
.registry-stat--total .registry-stat__icon{background:#edefff;color:#4842ba;}
.registry-stat--active .registry-stat__icon{background:#e8f9f1;color:#079765;}
.registry-stat--review .registry-stat__icon{background:#fff6e8;color:#c78524;}
.registry-stat--archived .registry-stat__icon{background:#fff0f1;color:#cb4c5f;}
.registry-panel {padding:0;overflow:hidden;border:1px solid #e2e7f1;border-radius:18px;box-shadow:0 12px 32px rgba(34,45,88,.035);}
.registry-panel__heading {
  padding:24px 26px 19px; margin:0; align-items:flex-end;gap:22px;
  background:#fff;border-bottom:1px solid #edf0f6;
}
.registry-panel__eyebrow {font-size:10px;letter-spacing:.12em;color:#777fb0;font-weight:800;}
.registry-panel__heading h2 {font-size:21px;margin:4px 0 3px;letter-spacing:-.025em;}
.registry-panel__heading p {font-size:12px;color:#8a96aa;}
.registry-actions {gap:10px;flex-wrap:wrap;justify-content:flex-end;}
.registry-search {width:260px;max-width:34vw;}
.registry-status-filter {min-width:156px;width:156px;}
.registry-refresh {background:#f5f6fc;color:#46518e;}
.registry-actions :deep(.q-field__control) {border-radius:11px;min-height:41px;height:41px;}
.registry-actions :deep(.q-field--dense .q-field__marginal) {height:41px;}
.registry-table :deep(thead tr) {background:#f7f8fc;}
.registry-table :deep(th) {
  font-size:10px; letter-spacing:.075em; padding:17px 21px;
  color:#6f7c9d; border-bottom:1px solid #e9edf5;
}
.registry-table :deep(td) {padding:15px 21px;border-color:#f0f2f8;font-size:12px;}
.registry-table :deep(tbody tr) {transition:background-color .16s ease;}
.registry-table :deep(tbody tr:hover) {background:#f9faff;}
.registry-system-icon {height:42px;width:42px;border-radius:12px!important;}
.registry-system-cell {gap:13px;}
.registry-system-cell strong {font-size:13px;font-weight:750;color:#202a59;}
.registry-system-cell small {margin-top:4px;color:#8c97b1;}
.registry-pill--status {padding:7px 11px;border-radius:99px;font-weight:750;}
.registry-pill__dot {height:6px;width:6px;}
.registry-table :deep(.q-table__bottom) {padding:14px 22px;border-top:1px solid #edf0f6;color:#73809c;}
/* Align the new-system entry and the six-step editor with the same design language. */
.registry-choice-dialog,.registry-existing-dialog,.registry-profile-init-dialog {box-shadow:0 25px 80px rgba(25,36,86,.16);}
.registry-choice-option {border-radius:16px;background:#fff;}
.registry-choice-option:hover {background:#f6f6ff;}
.registry-dialog--editor {border-radius:20px;}
.registry-dialog--editor .registry-wizard-header {padding:18px 26px;background:#fff;}
.registry-dialog--editor .registry-wizard-header__icon {border-radius:13px;}
.registry-dialog--editor .registry-wizard-sidebar {background:#f8f9fe;border-right:1px solid #ebedf7;}
.registry-dialog--editor .registry-wizard-step {border-radius:11px;}
.registry-dialog--editor .registry-wizard-main {background:#fff;}
.registry-dialog--editor .registry-wizard-footer {border-top:1px solid #edf0f8;}
.registry-dialog--editor .registry-wizard-footer .q-btn {border-radius:11px;}
@media(max-width:1100px) {
  .registry-heading__right {gap:9px;}
  .registry-live-indicator {display:none;}
  .registry-panel__heading {flex-direction:column;align-items:stretch;}
  .registry-actions {justify-content:flex-start;}
  .registry-search {width:min(390px,100%);max-width:none;}
}
@media(max-width:700px) {
  .registry-page.workspace-page {padding:20px 14px 45px;}
  .registry-heading {align-items:flex-start;gap:13px;}
  .registry-heading__main {gap:11px;}
  .registry-heading__icon {width:43px;height:43px;flex-basis:43px;border-radius:12px;}
  .registry-heading h1 {font-size:24px;}
  .registry-heading p {font-size:11px;}
  .registry-heading__right .registry-add {min-width:44px;padding:0 10px;}
  .registry-stats {grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;}
  .registry-stat {min-height:118px;padding:13px;}
  .registry-stat__body {gap:10px;margin-top:12px;}
  .registry-stat__icon {width:40px;height:40px;border-radius:11px;}
  .registry-stat strong {font-size:26px;}
  .registry-panel__heading {padding:18px 15px;}
  .registry-actions {width:100%;gap:8px;}
  .registry-search {flex:1 1 100%;}
  .registry-status-filter {flex:1 1 150px;min-width:0;}
  .registry-table :deep(th),.registry-table :deep(td) {padding-left:12px;padding-right:12px;}
}
</style>

<style scoped lang="scss">
/* DSWD ONE ICTMS refresh, scoped to Registry page and its existing dialog */
.registry-page.workspace-page {
  --registry-navy:#092c7a;--registry-blue:#0038a8;--registry-red:#ce1126;--registry-gold:#f5c342;
  --registry-soft:#f3f7ff;--registry-outline:#dbe4f4;
  max-width:1680px;padding-top:23px;color:#102a5c;
}
.registry-heading {
  position:relative;overflow:hidden;isolation:isolate;align-items:center;
  border:1px solid #d7e3f6;border-radius:16px;padding:22px 25px;
  background:linear-gradient(112deg,#fff 0%,#f1f6ff 52%,#dceaff 100%);
  box-shadow:0 8px 25px rgba(20,59,131,.045);margin-bottom:17px;
}
.registry-heading::before {
  content:'';position:absolute;inset:auto -8% -130px 43%;height:198px;z-index:-1;
  border-radius:50%;background:rgba(52,114,215,.08);transform:rotate(-12deg);
}

.registry-heading__icon {width:56px;height:56px;flex-basis:56px;border-radius:13px;
  background:#fff;border:1px solid #d7e2f6;color:#0038a8;
  box-shadow:0 4px 12px rgba(0,56,168,.08);
}
.registry-heading .section-kicker {color:#0038a8;letter-spacing:.09em;font-size:10px}
.registry-heading h1 {font-size:clamp(25px,2.35vw,34px);margin:4px 0;color:#091e57;letter-spacing:-.035em}
.registry-heading p{font-size:12px;max-width:640px;color:#51678e}
.registry-heading__right{position:relative;z-index:1;align-self:flex-end}
.registry-heading .registry-add{background:#0038a8;border-radius:9px;box-shadow:0 6px 16px rgba(0,56,168,.19)}
.registry-heading .registry-add:hover{background:#002c87}
.registry-stats {grid-template-columns:repeat(5,minmax(0,1fr));gap:11px;margin-bottom:18px}
.registry-stat {min-height:107px;border-radius:12px;padding:15px 15px 13px;border:1px solid #dce5f4;
  border-left:4px solid #0038a8;box-shadow:0 5px 16px rgba(15,49,117,.04)}
.registry-stat__top {color:#526386;font-size:10px;letter-spacing:0;font-weight:800}
.registry-stat__top > .q-icon{display:none}
.registry-stat__body{margin-top:11px;gap:10px}
.registry-stat__icon{width:42px;height:42px;border-radius:11px;background:#e7efff;color:#0038a8}
.registry-stat__icon .q-icon{font-size:22px!important}
.registry-stat strong{font-size:28px;color:#09285f}
.registry-stat p{font-size:10px;margin-top:3px}
.registry-stat--active{border-left-color:#16995d}
.registry-stat--review{border-left-color:#ec8f23}
.registry-stat--development{border-left-color:#2587df}
.registry-stat--development .registry-stat__icon{background:#e5f4ff;color:#1075c7}
.registry-stat--archived{border-left-color:#6b7b9a}
.registry-stat--archived .registry-stat__icon{background:#eff2f7;color:#637491}
.registry-panel{border-color:#dbe5f5;border-radius:13px;box-shadow:0 7px 25px rgba(20,47,104,.045)}
.registry-panel__heading{padding:18px 20px;border-bottom:2px solid #edf1f8;align-items:center}
.registry-panel__eyebrow {color:#0038a8}
.registry-panel__heading h2{font-size:18px;color:#09265e}
.registry-panel__count{font-size:14px;color:#6b7d9f;font-weight:650}
.registry-panel__heading p{font-size:11px}
.registry-actions :deep(.q-field__control){border-radius:8px;background:#fff}
.registry-actions :deep(.q-field--outlined .q-field__control:before){border-color:#ccd9ef}
.registry-refresh{background:#edf3ff;color:#0038a8}
.registry-table :deep(thead tr){background:#eff4fd}
.registry-table :deep(th){color:#1a3a7c;letter-spacing:.03em;font-size:10px}
.registry-table :deep(td){padding-top:11px;padding-bottom:11px;color:#283f70}
.registry-table :deep(tbody tr:hover){background:#f2f7ff}
.registry-system-icon{background:#0038a8!important;border-radius:9px!important}
.registry-system-cell strong{color:#0f2d6c}
.registry-pill--status{border-radius:30px}
.registry-pill--status.is-development{background:#e7efff;color:#1449be}
.registry-pill--status.is-review{background:#fff2e2;color:#b45b00}
.registry-pill--status.is-archived{background:#edf0f5;color:#53617b}
.registry-dialog--editor{border-radius:20px;box-shadow:0 30px 90px rgba(8,31,83,.21)}
.registry-dialog--editor .registry-wizard-header{position:relative;overflow:hidden;background:linear-gradient(115deg,#fff,#f2f6ff);border-bottom:1px solid #dfE7f5;padding:20px 26px}
.registry-dialog--editor .registry-wizard-header::after{content:'';position:absolute;top:-26px;right:64px;width:150px;height:53px;transform:rotate(-17deg);background:linear-gradient(#f4cc34 0 28%,#ce1126 28% 56%,#0038a8 56% 84%,transparent 84%);border-radius:0 0 0 60%;opacity:.8;pointer-events:none}
.registry-dialog--editor .registry-wizard-header__icon{background:#e9f0ff;color:#0038a8;border:1px solid #dce7fa}
.registry-dialog--editor .registry-wizard-header__eyebrow{color:#0038a8}
.registry-dialog--editor .registry-wizard-header__copy .text-h6{color:#102b64;font-weight:800}
.registry-wizard-progress__fill{background:#0038a8}
.registry-dialog--editor .registry-wizard-sidebar{background:#f7f9fe;border-right:1px solid #e0e8f5}
.registry-dialog--editor .registry-wizard-step{color:#48618e;min-height:48px;border-radius:9px}
.registry-dialog--editor .registry-wizard-step.is-current{background:#0038a8;border-color:#0038a8;color:#fff;box-shadow:0 5px 11px rgba(0,56,168,.17)}
.registry-dialog--editor .registry-wizard-step.is-current::before{background:#ce1126;top:8px;bottom:8px}
.registry-dialog--editor .registry-wizard-step.is-current .registry-wizard-step__arrow{color:#fff}
.registry-dialog--editor .registry-wizard-step:hover:not(:disabled):not(.is-current){background:#ebf2ff;color:#0038a8}
.registry-dialog--editor .registry-wizard-main{background:#fdfefe}
.registry-dialog--editor .registry-wizard-footer{background:#fff;border-top:1px solid #e3eaf7}
.registry-dialog--editor .registry-wizard-footer .q-btn--unelevated{background:#0038a8!important}
.registry-overview-block,.registry-overview-block:first-of-type{border:1px solid #dce6f7;border-radius:13px;background:#fff;box-shadow:0 3px 10px rgba(14,45,108,.025);padding:20px;margin:0}
.registry-overview-block:first-of-type{padding-top:20px}
.registry-overview-block__heading{margin-bottom:17px;gap:10px}
.registry-overview-block__heading h5{font-size:14px;color:#0c2b70}
.registry-overview-heading-icon{width:32px;height:32px;display:grid;place-items:center;border-radius:9px;background:#eaf1ff;color:#0038a8}
.registry-details-readonly__item dt{color:#657da7;font-size:11px}
.registry-details-readonly__item dd{color:#0c285f}
.registry-details-readonly__status{border-radius:8px}
.registry-overview-list__row{border-color:#e5ebf7}
@media(max-width:1250px){.registry-stats{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:800px){.registry-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.registry-heading{padding:18px}.registry-heading__right{align-self:center}.registry-panel__heading{flex-direction:column;align-items:stretch}}
@media(max-width:560px){.registry-stats{gap:9px}.registry-stat{padding:12px;min-height:100px}.registry-stat strong{font-size:25px}.registry-heading{align-items:flex-start;flex-direction:column}.registry-heading__right{align-self:flex-start}.registry-heading__icon{width:46px;height:46px;flex-basis:46px}.registry-panel__heading{padding:16px}.registry-dialog--editor .registry-wizard-header::after{display:none}}
</style>

<style scoped>
/* Modern Registry modal inspired by the supplied reference, aligned to DSWD blue. */
.registry-dialog--editor{width:min(1340px,96vw)!important;max-width:1340px!important;border-radius:24px!important;box-shadow:0 35px 95px rgba(12,34,90,.27)!important}
.registry-dialog--editor .registry-wizard-header{position:relative;isolation:isolate;min-height:126px;padding:24px 30px!important;background:linear-gradient(114deg,#ffffff 0%,#f6f9ff 54%,#eaf1ff 100%)!important;border-bottom:1px solid #dee7fa!important;gap:18px}
.registry-dialog--editor .registry-wizard-header::before{content:'';position:absolute;right:58px;bottom:-70px;width:345px;height:165px;background:linear-gradient(130deg,rgba(0,56,168,.04),rgba(65,108,227,.13));transform:rotate(-22deg);border-radius:50%;z-index:-1;pointer-events:none}
.registry-dialog--editor .registry-wizard-header::after{top:0!important;right:0!important;width:145px!important;height:7px!important;transform:none!important;border-radius:0 24px 0 10px!important;background:linear-gradient(90deg,#ffcf35 0% 34%,#ce1126 34% 65%,#0038a8 65%)!important;opacity:1!important}
.registry-dialog--editor .registry-wizard-header__icon{width:64px;height:64px;border-radius:18px!important;display:grid;place-items:center;background:linear-gradient(145deg,#edf3ff,#dce7ff)!important;color:#0038a8!important;flex:none}
.registry-dialog--editor .registry-wizard-header__copy{position:relative;z-index:1;min-width:0}
.registry-dialog--editor .registry-wizard-header__eyebrow{font-size:11px;letter-spacing:.12em;font-weight:850!important;color:#0038a8!important}
.registry-dialog--editor .registry-wizard-header__copy .text-h6{font-size:24px!important;font-weight:850!important;line-height:1.25;margin:5px 0;color:#10275d!important}
.registry-dialog--editor .registry-wizard-header__subtitle{color:#5b6e98;max-width:640px;margin:3px 0 0;font-size:13px}
.registry-wizard-header__art{position:relative;flex:none;width:115px;height:73px;margin-left:auto;margin-right:4px;display:flex;align-items:center;justify-content:center}
.registry-wizard-header__art-screen{width:93px;height:59px;border:4px solid #fff;border-radius:13px;background:linear-gradient(130deg,#0038a8,#4a73d8);color:#fff;display:grid;place-items:center;box-shadow:0 9px 23px rgba(0,56,168,.24);transform:rotate(5deg)}
.registry-wizard-header__art-gear{position:absolute;right:-4px;bottom:-2px;display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:#fff;color:#0038a8;box-shadow:0 4px 14px rgba(0,56,168,.19)}
.registry-dialog--editor .registry-wizard-header__aside{align-self:flex-start;z-index:2;margin-left:6px}
.registry-dialog--editor .registry-wizard-header__aside .q-btn{background:#fff;color:#223f77;box-shadow:0 3px 11px rgba(18,55,127,.1)}
.registry-dialog--editor .registry-wizard-layout{grid-template-columns:266px minmax(0,1fr)}
.registry-dialog--editor .registry-wizard-sidebar{background:linear-gradient(180deg,#f6f8ff,#fbfcff)!important;border-right:1px solid #e1e8fa!important;padding:27px 18px!important}
.registry-dialog--editor .registry-wizard-steps{gap:8px!important}
.registry-dialog--editor .registry-wizard-step{display:flex!important;align-items:center;justify-content:flex-start;text-align:left;gap:13px!important;font-size:14px!important;font-weight:750!important;padding:14px 15px!important;min-height:52px!important;border-radius:12px!important}
.registry-dialog--editor .registry-wizard-step__icon{flex:none;opacity:.9}
.registry-dialog--editor .registry-wizard-step__arrow{margin-left:auto}
.registry-dialog--editor .registry-wizard-step.is-current{background:linear-gradient(110deg,#0038a8,#2557cd)!important;border:1px solid #0038a8!important;color:#fff!important;box-shadow:0 8px 18px rgba(0,56,168,.19)!important}
.registry-dialog--editor .registry-wizard-step.is-complete:not(.is-current){background:transparent!important;color:#42577c!important}
.registry-dialog--editor .registry-wizard-main{background:#fbfcff!important;padding:26px clamp(20px,2.3vw,40px) 38px!important}
.registry-dialog--editor .registry-details-view{gap:18px!important}
.registry-dialog--editor .registry-overview-block{background:#fff;border:1px solid #dce5f8;border-radius:17px;box-shadow:0 4px 14px rgba(15,48,116,.035);padding:22px!important}
.registry-dialog--editor .registry-overview-block--profile{padding:0!important;overflow:hidden}
.registry-profile-summary{display:flex;align-items:center;gap:18px;min-height:115px;padding:22px 28px;background:linear-gradient(110deg,#f3f7ff,#e8efff);position:relative;flex-wrap:wrap}
.registry-profile-summary__icon{width:60px;height:60px;background:#fff;color:#0038a8;display:grid;place-items:center;border-radius:16px;border:1px solid #d8e3ff;box-shadow:0 6px 14px rgba(0,56,168,.09);flex:none}
.registry-profile-summary__copy{min-width:0;flex:1;border-left:2px solid #b6c9fc;padding-left:18px}
.registry-profile-summary__kicker{display:block;font-size:11px;letter-spacing:.1em;font-weight:800;color:#0038a8}
.registry-profile-summary__copy h3{margin:5px 0 0;font-size:27px;font-weight:850;line-height:1.2;color:#0e2d72;overflow-wrap:anywhere}
.registry-profile-summary__status{display:inline-flex;align-items:center;gap:7px;max-width:100%;padding:9px 14px;border-radius:100px;background:#e4f6ed;color:#137a4d;font-weight:800;font-size:13px;white-space:nowrap}
.registry-profile-summary__status.is-review{background:#fff2df;color:#b56a04}
.registry-profile-summary__status.is-archived{background:#eef0f5;color:#657087}
.registry-profile-summary__dot{width:8px;height:8px;border-radius:50%;background:currentColor}
.registry-profile-summary__details{margin:0;display:grid;grid-template-columns:1fr 1fr;gap:0;padding:22px 28px 24px}
.registry-profile-summary__detail{display:flex;align-items:flex-start;gap:13px;min-width:0}
.registry-profile-summary__detail+ .registry-profile-summary__detail{border-left:1px solid #dfe7f7;padding-left:24px}
.registry-profile-summary__detail-icon{width:34px;height:34px;background:#eff4ff;color:#0038a8;display:grid;place-items:center;border-radius:10px;flex:none}
.registry-profile-summary__detail dt{color:#6075a2;font-size:12px;font-weight:750;margin-bottom:6px}
.registry-profile-summary__detail dd{margin:0;color:#142e65;font-size:14px;line-height:1.5;font-weight:650;overflow-wrap:anywhere}
.registry-dialog--editor .registry-overview-block__heading{margin:0 0 16px;gap:12px}
.registry-dialog--editor .registry-overview-block__heading h5{font-size:17px;font-weight:850;color:#0e2d72}
.registry-dialog--editor .registry-overview-heading-icon{width:40px;height:40px;border-radius:12px;background:#e9f0ff;color:#0038a8}
.registry-dialog--editor .registry-details-section__fields{gap:12px 20px}
.registry-dialog--editor .registry-details-readonly__item:not(.registry-details-readonly__item--wide){padding:13px 15px;background:#f6f8ff;border-radius:11px;min-height:67px}
.registry-dialog--editor .registry-details-readonly__item--wide{padding:13px 15px;background:#f6f8ff;border-radius:11px}
.registry-dialog--editor .registry-details-readonly__item dt{font-size:12px;font-weight:750;color:#5b70a0;margin:0 0 7px}
.registry-dialog--editor .registry-details-readonly__item dd{font-size:14px;font-weight:750;color:#1b356d;line-height:1.4;margin:0}
.registry-dialog--editor .registry-wizard-footer{min-height:70px;background:white!important;padding:12px 26px!important}
.registry-dialog--editor .registry-wizard-footer .q-btn--unelevated{border-radius:11px!important;min-width:106px}
@media(max-width:1000px){.registry-dialog--editor .registry-wizard-layout{grid-template-columns:215px minmax(0,1fr)}.registry-dialog--editor .registry-wizard-sidebar{padding:20px 10px!important}.registry-dialog--editor .registry-wizard-main{padding:20px!important}.registry-wizard-header__art{display:none}}
@media(max-width:900px){.registry-dialog--editor .registry-wizard-layout{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr)}.registry-dialog--editor .registry-wizard-sidebar{padding:10px 12px!important}.registry-dialog--editor .registry-wizard-steps{flex-direction:row!important;overflow-x:auto}.registry-dialog--editor .registry-wizard-step{width:auto!important;white-space:nowrap;flex:none;padding:10px!important;min-height:44px!important}.registry-profile-summary__details{grid-template-columns:1fr;gap:16px}.registry-profile-summary__detail+ .registry-profile-summary__detail{border-left:0;border-top:1px solid #e3eaf7;padding:16px 0 0}}
@media(max-width:600px){.registry-dialog--editor .registry-wizard-header{min-height:86px;padding:14px 16px!important}.registry-dialog--editor .registry-wizard-header__icon{width:42px;height:42px;border-radius:12px!important}.registry-dialog--editor .registry-wizard-header__copy .text-h6{font-size:19px!important}.registry-dialog--editor .registry-wizard-main{padding:13px!important}.registry-dialog--editor .registry-overview-block{padding:15px!important}.registry-dialog--editor .registry-overview-block--profile{padding:0!important}.registry-profile-summary{padding:16px;gap:10px}.registry-profile-summary__copy{padding-left:10px}.registry-profile-summary__copy h3{font-size:19px}.registry-profile-summary__icon{width:43px;height:43px}.registry-profile-summary__status{margin-left:0}.registry-profile-summary__details{padding:16px}.registry-dialog--editor .registry-wizard-footer{padding:9px!important}}
</style>

<style scoped>
/* Management-only layout: one shared two-column grid for every editable field. */
.registry-management {
  gap: 22px !important;
}
.registry-management__card {
  background: #fff;
  border: 1px solid #dae4f8;
  border-radius: 17px;
  overflow: hidden;
  box-shadow: 0 6px 22px rgba(20, 55, 116, .035);
}
.registry-management__heading {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 23px;
  background: linear-gradient(110deg, #f0f5ff, #f9fbff);
  border-bottom: 1px solid #e3eafa;
}
.registry-management__icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 47px;
  height: 47px;
  border-radius: 13px;
  background: #e0eaff;
  color: #0038a8;
}
.registry-management__heading h3 {
  margin: 0 0 3px;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.3;
  color: #102e6c;
}
.registry-management__heading p {
  margin: 0;
  font-size: 12px;
  color: #7184a5;
  line-height: 1.45;
}
/* The type field occupies the first cell. The conditional row takes both
   columns, so each conditional field matches the width of the type field. */
.registry-dialog--editor .registry-management__body {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 16px;
  row-gap: 16px;
  align-items: start;
  padding: 24px;
}
.registry-dialog--editor .registry-management__type {
  grid-column: 1 / -1;
  width: 100%;
  max-width: none;
  min-width: 0;
}
.registry-dialog--editor .registry-management__conditional {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  width: 100%;
  max-width: none;
  min-width: 0;
}
.registry-dialog--editor .registry-management__conditional > .q-field,
.registry-dialog--editor .registry-management__timeline > .q-field,
.registry-dialog--editor .registry-management__type {
  min-width: 0;
  width: 100%;
  margin: 0;
}
/* No shrinking the Managing Office field when it is the only visible option. */
.registry-dialog--editor .registry-management__timeline {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.registry-dialog--editor .registry-management__timeline > .registry-management__duration {
  grid-column: 1 / -1;
}
/* Same input height, same outline radius, same text alignment on all 6 controls. */
.registry-dialog--editor .registry-management :deep(.q-field--outlined .q-field__control) {
  min-height: 56px;
  height: 56px;
  border-radius: 9px;
  background: #fff;
}
.registry-dialog--editor .registry-management :deep(.q-field__marginal) {
  height: 56px;
}
.registry-dialog--editor .registry-management :deep(.q-field__native),
.registry-dialog--editor .registry-management :deep(.q-field__input) {
  min-width: 0;
}
@media (max-width: 720px) {
  .registry-management__heading { padding: 16px; }
  .registry-dialog--editor .registry-management__body {
    grid-template-columns: minmax(0, 1fr);
    padding: 16px;
  }
  .registry-dialog--editor .registry-management__conditional,
  .registry-dialog--editor .registry-management__timeline {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>

<style scoped>
/* Stakeholders: Managing Office selection beside assigned groups. */
.registry-stakeholders-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 20px;
  width: 100%;
}
.registry-stakeholders-column {
  min-width: 0;
  border: 1px solid #dce5f5;
  border-radius: 15px;
  background: #fff;
  padding: 18px;
  box-shadow: 0 4px 15px rgba(19, 51, 113, .035);
}
.registry-stakeholders-column__heading {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.registry-stakeholders-column__icon {
  width: 40px;
  height: 40px;
  flex: none;
  display: grid;
  place-items: center;
  background: #eaf1ff;
  color: #0038a8;
  border-radius: 11px;
}
.registry-stakeholders-column__heading h3 {
  color: #102e6c;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.35;
  margin: 0;
}
.registry-stakeholders-column__heading p {
  color: #7585a1;
  font-size: 11px;
  margin: 3px 0 0;
}
.registry-stakeholders-column .registry-stakeholder-section {
  margin: 0;
  padding: 0;
  border: 0;
}
.registry-stakeholders-column .registry-stakeholder-section__title {margin-bottom: 13px;}
.registry-stakeholders-column .registry-assign-controls {flex-wrap: wrap;}
.registry-stakeholders-column .registry-assign-type {flex: 1 1 200px;}
.registry-stakeholders-column .registry-assigned-groups {gap: 12px;}
.registry-stakeholders-column .registry-stakeholder-item {padding: 10px;gap: 8px;}
.registry-stakeholders-column .registry-stakeholder-person {flex-basis: 120px;}
.registry-stakeholders-column .registry-stakeholder-list {max-height: 400px;}
@media (max-width: 1080px) {
  .registry-stakeholders-grid {grid-template-columns: 1fr;}
}
@media (max-width: 600px) {
  .registry-stakeholders-column {padding: 13px;}
  .registry-stakeholders-column .registry-assign-controls > .q-btn {width: 100%;}
}
</style>

<style scoped>
/* Business Owner and Managing Office panels share the assignment column. */
.registry-stakeholders-column > .registry-stakeholder-section + .registry-stakeholder-section {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid #e3eaf7;
}
</style>

<style scoped>
/* Two stacked workflow sections; each contains Owner | Managing Office columns. */
.registry-stakeholders-layout { gap: 22px !important; }
.registry-stakeholder-workflow { min-width: 0; }
.registry-stakeholder-workflow > .registry-stakeholders-column__heading { margin: 0 0 14px; }
.registry-stakeholders-layout .registry-stakeholders-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; gap: 16px; }
.registry-stakeholders-layout .registry-stakeholder-section,
.registry-stakeholders-layout .registry-assigned-department { min-width: 0; border: 1px solid #dce5f5; border-radius: 14px; background: #fff; padding: 16px; box-shadow: 0 4px 15px rgba(19,51,113,.035); }
.registry-stakeholders-layout .registry-stakeholder-section__title { margin-bottom: 14px; }
.registry-stakeholders-layout .registry-stakeholder-list { max-height: 285px; }
.registry-stakeholders-layout .registry-assign-controls { flex-wrap: wrap; padding: 12px; }
.registry-stakeholders-layout .registry-assign-type { flex: 1 1 185px; }
.registry-assigned-unclassified { margin-top: 16px; padding: 16px; border: 1px dashed #cfd9ee; border-radius: 14px; background: #f8faff; }
@media (max-width: 980px) { .registry-stakeholders-layout .registry-stakeholders-grid { grid-template-columns: 1fr; } }
</style>

<style scoped lang="scss">
/* Repository tab: Library-driven solution buttons, scoped repository cards. */
.registry-repository-section{background:#fff;border:1px solid #dce5f6;border-radius:15px;padding:20px;min-width:0}
.registry-repository-section__header{display:flex;align-items:center;gap:12px;color:#0038a8;margin-bottom:17px}
.registry-repository-section__header h3{font-size:16px;line-height:1.3;font-weight:800;color:#143269;margin:0}
.registry-repository-section__header p{font-size:12px;line-height:1.4;color:#6b7da0;margin:4px 0 0}
.registry-repository-options{display:grid;grid-template-columns:repeat(auto-fit,minmax(128px,1fr));gap:10px}
.registry-repository-option{appearance:none;border:1px solid #dce5f5;border-radius:11px;background:#f8faff;color:#294677;display:flex;align-items:center;justify-content:center;gap:9px;padding:13px 10px;cursor:pointer;font:inherit;font-size:12px;font-weight:750;min-height:54px;transition:background .15s,border-color .15s}
.registry-repository-option:hover{background:#eef4ff;border-color:#8aaee8}
.registry-repository-option.is-selected{background:#eaf2ff;border:2px solid #0038a8;color:#0038a8;padding:12px 9px}
.registry-repository-option:focus-visible{outline:3px solid #96b7f4;outline-offset:2px}
.registry-repository-pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.registry-repository-fields{display:grid;grid-template-columns:1fr;gap:16px}
.registry-repository-fields>.q-field{min-width:0;width:100%}
@media(max-width:780px){.registry-repository-pair{grid-template-columns:1fr}.registry-repository-section{padding:16px}}
</style>

<style scoped>
/* Technology Used step: presentation only; model bindings remain unchanged. */
.registry-technology { display: flex; flex-direction: column; gap: 20px; }
.registry-technology__intro { display: flex; align-items: center; gap: 13px; padding: 4px 0 2px; }
.registry-technology__intro-icon { display: grid; place-items: center; flex: none; width: 48px; height: 48px; border-radius: 14px; background: #e7efff; color: #0038a8; }
.registry-technology__intro h3 { margin: 0; color: #102f6a; font-size: 17px; font-weight: 800; line-height: 1.35; }
.registry-technology__intro p { margin: 4px 0 0; font-size: 12px; color: #6b7e9d; line-height: 1.5; }
.registry-technology__stack-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.registry-technology__card { min-width: 0; padding: 22px; border: 1px solid #dae5f6; border-radius: 17px; background: #fff; box-shadow: 0 5px 20px rgba(16, 50, 109, .04); }
.registry-technology__card-header { display: flex; align-items: center; gap: 12px; padding-bottom: 17px; margin-bottom: 20px; border-bottom: 1px solid #edf1f8; }
.registry-technology__card-icon { flex: none; display: grid; place-items: center; width: 43px; height: 43px; border-radius: 12px; }
.registry-technology__card-icon--frontend { background: #e7efff; color: #0038a8; }
.registry-technology__card-icon--backend { background: #e7f4f7; color: #14647c; }
.registry-technology__card-icon--infra { background: #eef0ff; color: #3b4ba0; }
.registry-technology__card-header h4 { margin: 0; color: #17356c; font-size: 15px; font-weight: 800; line-height: 1.4; }
.registry-technology__card-header p { margin: 3px 0 0; color: #7383a0; font-size: 11px; line-height: 1.5; }
.registry-technology__field { width: 100%; min-width: 0; }
.registry-technology :deep(.registry-technology__field.q-field--outlined .q-field__control) { min-height: 56px; border-radius: 10px; background: #fff; }
.registry-technology :deep(.registry-technology__field .q-field__prepend) { color: #6480b2; }
.registry-technology__helper { display: flex; align-items: center; gap: 6px; margin-top: 12px; font-size: 11px; color: #7182a2; }
.registry-technology__infra-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.registry-technology__server-name { grid-column: 1 / -1; }
@media (max-width: 850px) {
  .registry-technology__stack-grid { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .registry-technology__card { padding: 16px; }
  .registry-technology__infra-grid { grid-template-columns: 1fr; }
  .registry-technology__server-name { grid-column: auto; }
  .registry-technology__intro { align-items: flex-start; }
}
</style>

<style scoped>
/* Scrum planning preview — visually separate from the Registry wizard */
.scrum-planner { display:flex; flex-direction:column; width:100%; height:100%; min-height:0; background:#f5f7fc; color:#243454; font-family:inherit; }
.scrum-planner__header { display:flex; align-items:center; justify-content:space-between; gap:20px; flex-shrink:0; padding:19px 28px; background:linear-gradient(112deg,#10296e 0%,#214ca1 67%,#316bc7 100%); color:#fff; }
.scrum-planner__identity,.scrum-planner__header-actions { display:flex; align-items:center; gap:16px; }
.scrum-planner__mark { display:flex; align-items:center; justify-content:center; width:50px; height:50px; border-radius:14px; background:rgba(255,255,255,.13); border:1px solid rgba(255,255,255,.21); }
.scrum-planner__eyebrow { font-size:10px; font-weight:800; letter-spacing:1.5px; color:#b9d3ff; }
.scrum-planner__eyebrow span { padding:0 7px; opacity:.6; }
.scrum-planner__identity h2 { font-size:22px; font-weight:800; line-height:1.25; margin:4px 0 2px; }
.scrum-planner__identity p { margin:0; font-size:12px; color:#d4e2ff; }
.scrum-planner__preview-badge { background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.23); color:#fff; font-weight:700; font-size:10px; padding:7px 10px; letter-spacing:.5px; }
.scrum-planner__overview { padding:18px 28px; display:grid; grid-template-columns:minmax(240px,2fr) repeat(4,minmax(105px,1fr)); gap:12px; flex-shrink:0; }
.scrum-planner__project,.scrum-planner__metric { min-height:78px; display:flex; align-items:center; gap:12px; border-radius:13px; border:1px solid #e0e6f1; background:#fff; padding:14px 16px; box-shadow:0 2px 8px rgba(25,44,92,.025); }
.scrum-planner__project-icon { display:grid; place-items:center; width:43px; height:43px; background:#e9efff; color:#17499a; border-radius:11px; }
.scrum-planner__project div:last-child,.scrum-planner__metric div { display:flex; flex-direction:column; min-width:0; }
.scrum-planner__project small,.scrum-planner__sprint-summary span { color:#8693ad; letter-spacing:1px; font-size:9px; font-weight:800; }
.scrum-planner__project strong { font-weight:800; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.scrum-planner__project div:last-child>span { color:#7483a1; font-size:11px; }
.scrum-planner__metric>.q-icon { color:#2c65b6; font-size:22px; }
.scrum-planner__metric strong { font-size:22px; font-weight:850; line-height:1.2; }
.scrum-planner__metric span { color:#7a879e; font-size:11px; white-space:nowrap; }
.scrum-planner__notice { margin:0 28px 16px; border:1px solid #d8e4f8; background:#eef4ff; color:#345487; padding:11px 14px; border-radius:10px; display:flex; align-items:flex-start; gap:10px; font-size:12px; line-height:1.55; flex-shrink:0; }
.scrum-planner__notice .q-icon { flex-shrink:0; margin-top:1px; }
.scrum-planner__workspace { display:grid; grid-template-columns:minmax(0,1.04fr) minmax(0,.96fr); gap:18px; padding:0 28px 18px; flex:1; min-height:0; }
.scrum-planner__column { display:flex; flex-direction:column; min-height:0; background:#fff; border:1px solid #dfe6f2; border-radius:16px; overflow:hidden; box-shadow:0 5px 17px rgba(30,52,98,.035); }
.scrum-planner__column-head { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:18px 20px 15px; flex-shrink:0; }
.scrum-planner__column-title { display:flex; gap:11px; align-items:center; }
.scrum-planner__column-title h3 { margin:0; font-size:15px; font-weight:800; }
.scrum-planner__column-title p { margin:3px 0 0; font-size:11px; color:#8a95a9; }
.scrum-planner__column-icon { display:grid; place-items:center; width:40px; height:40px; border-radius:11px; }
.scrum-planner__column-icon--ai { background:#f0ecff; color:#7356bc; }
.scrum-planner__column-icon--sprint { background:#e6f1ff; color:#215db0; }
.scrum-planner__count { background:#edf1f9; color:#4b5d7d; border-radius:20px; font-weight:750; padding:7px 10px; }
.scrum-planner__view-tabs { display:flex; gap:16px; padding:0 20px 12px; border-bottom:1px solid #edf0f6; flex-shrink:0; flex-wrap:wrap; }
.scrum-planner__view-tab { display:inline-flex; align-items:center; gap:7px; background:transparent; border:0; border-bottom:2px solid transparent; padding:8px 0; font:inherit; font-size:12px; font-weight:700; color:#718099; cursor:pointer; }
.scrum-planner__view-tab.is-selected { color:#234ea2; border-bottom-color:#234ea2; }
.scrum-planner__connection-panel { padding:12px 20px 14px; border-bottom:1px solid #edf0f6; flex-shrink:0; max-height:265px; overflow-y:auto; }
.scrum-planner__connection-label { display:flex; gap:6px; align-items:center; font-size:11px; font-weight:800; color:#495b76; margin-bottom:7px; }
.scrum-planner__connection-tabs { display:flex; align-items:center; gap:6px; overflow-x:auto; padding-bottom:7px; }
.scrum-planner__connection-count { display:inline-block; margin-left:4px; font-size:10px; opacity:.75; }
.scrum-planner__connection-story,.scrum-planner__connection-criterion { font-size:11px; line-height:1.5; color:#536680; margin:2px 0 10px; }
.scrum-planner__connection-caption { font-size:10px; color:#8290a5; margin-top:5px; }
.scrum-planner__filters { display:flex; gap:6px; align-items:center; overflow-x:auto; padding:0 20px 14px; flex-shrink:0; }
.scrum-planner__filter,.scrum-planner__sprint-tab { font-family:inherit; cursor:pointer; border:1px solid #e0e5ef; border-radius:8px; padding:7px 11px; font-size:11px; font-weight:750; background:#fff; color:#667590; white-space:nowrap; transition:background .2s,color .2s; }
.scrum-planner__filter.is-selected { color:#fff; background:#234ea2; border-color:#234ea2; }
.scrum-planner__task-list { background:#f9fbfe; border-top:1px solid #eef0f6; flex:1; overflow-y:auto; min-height:0; padding:14px; display:flex; flex-direction:column; gap:10px; }
.scrum-planner__task { padding:14px 15px 12px; border:1px solid #e1e7f1; border-radius:12px; background:#fff; cursor:grab; box-shadow:0 2px 8px rgba(34,51,86,.025); }
.scrum-planner__task.is-dragging { opacity:.5; }
.scrum-planner__task-meta { display:flex; align-items:center; gap:8px; }
.scrum-planner__drag-handle { margin-left:auto; color:#aeb8cc; cursor:grab; font-size:19px; }
.scrum-planner__task h4,.scrum-planner__planned-task h4 { font-size:13px; margin:8px 0 5px; line-height:1.4; font-weight:800; }
.scrum-planner__task p { margin:0 0 12px; color:#79879a; font-size:11px; line-height:1.5; }
.scrum-planner__task-bottom,.scrum-planner__planned-bottom { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; }
.scrum-planner__tags { display:flex; gap:6px; }
.scrum-planner__tags span { display:flex; align-items:center; gap:3px; background:#f2f5fa; border-radius:5px; padding:5px 7px; color:#6f7f99; font-size:10px; font-weight:700; }
.scrum-planner__review-state { border-radius:20px; background:#fff5e3; color:#a9711c; font-size:10px; padding:5px 9px; font-weight:750; white-space:nowrap; }
.scrum-planner__review-state.is-approved { background:#e7f7ed; color:#18844c; }
.scrum-planner__review-state.is-revision { background:#ffedeb; color:#b45445; }
.scrum-planner__review-actions,.scrum-planner__planned-actions { display:flex; justify-content:flex-end; gap:4px; flex-wrap:wrap; padding-top:10px; margin-top:10px; border-top:1px solid #eef1f6; }
.scrum-planner__review-actions .q-btn,.scrum-planner__planned-actions .q-btn { font-size:11px; }
.scrum-planner__sprint-tabs { display:flex; gap:7px; border-bottom:1px solid #e9eef6; padding:0 20px 13px; overflow-x:auto; flex-shrink:0; }
.scrum-planner__sprint-tab { border-color:transparent; background:#f4f6fb; }
.scrum-planner__sprint-tab.is-selected { background:#e7efff; color:#1a4ca1; border-color:#bdd1fb; }
.scrum-planner__sprint-tab span { display:inline-block; font-size:10px; margin-left:6px; background:#fff; border-radius:6px; padding:2px 5px; }
.scrum-planner__sprint-summary { display:flex; align-items:center; justify-content:space-between; gap:10px; background:#f8faff; padding:12px 20px; flex-shrink:0; }
.scrum-planner__sprint-summary div { display:flex; flex-direction:column; gap:3px; }
.scrum-planner__sprint-summary strong { font-size:13px; color:#28426e; }
.scrum-planner__dropzone { margin:14px; border:2px dashed #ccdaee; border-radius:13px; padding:12px; flex:1; min-height:190px; background:#fafdff; overflow:auto; display:flex; flex-direction:column; gap:11px; }
.scrum-planner__dropzone.is-over { border-color:#3975cd; background:#f0f5ff; }
.scrum-planner__drop-hint { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:9px; text-align:center; margin:auto; padding:28px 15px; }
.scrum-planner__drop-icon { background:#eaf0fb; color:#6789c3; display:grid; place-items:center; width:69px; height:69px; border-radius:50%; }
.scrum-planner__drop-hint strong { font-size:15px; }
.scrum-planner__drop-hint p { margin:0; max-width:270px; font-size:12px; line-height:1.6; color:#79879d; }
.scrum-planner__drop-hint>span:last-child { color:#8996ad; font-size:11px; }
.scrum-planner__planned-task { border:1px solid #dce6f5; background:#fff; border-radius:10px; padding:13px; cursor:grab; box-shadow:0 2px 6px rgba(27,53,99,.04); }
.scrum-planner__planned-bottom { color:#8390a5; font-size:11px; }
.scrum-planner__sprint-footer { padding:12px 20px; border-top:1px solid #ecf0f6; display:flex; align-items:center; gap:9px; color:#7c8ba1; font-size:11px; flex-shrink:0; }
.scrum-planner__sprint-footer .q-icon { color:#3568b5; }
.scrum-planner__empty { display:flex; flex-direction:column; align-items:center; gap:6px; padding:40px 20px; text-align:center; color:#8996aa; }
.scrum-planner__empty strong { color:#5f7292; }
.scrum-planner__empty span { font-size:11px; }
.scrum-planner__footer { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-shrink:0; padding:13px 28px; border-top:1px solid #e3e8f2; background:#fff; }
.scrum-planner__footer>span { color:#94a1b4; font-size:11px; display:flex; align-items:center; gap:7px; }
.scrum-planner__footer>div { display:flex; gap:8px; }
@media (max-width:1100px) { .scrum-planner__overview { grid-template-columns:repeat(4,minmax(0,1fr)); }.scrum-planner__project { grid-column:span 4; }.scrum-planner__workspace { gap:12px; }.scrum-planner__header { padding:18px; }.scrum-planner__workspace { padding:0 18px 14px; }.scrum-planner__overview { padding:14px 18px; }.scrum-planner__notice { margin:0 18px 12px; } }
@media (max-width:750px) { .scrum-planner__header-actions .scrum-planner__preview-badge { display:none; }.scrum-planner__identity h2 { font-size:18px; }.scrum-planner__identity p { font-size:11px; }.scrum-planner__workspace { grid-template-columns:1fr; overflow:auto; }.scrum-planner__column { min-height:425px; }.scrum-planner__overview { grid-template-columns:repeat(2,minmax(0,1fr)); }.scrum-planner__project { grid-column:span 2; }.scrum-planner__footer { padding:12px 18px; }.scrum-planner__footer>span { display:none; } }
</style>

<style scoped>
.registry-execution-confirm { width:min(690px,calc(100vw - 32px)); max-width:690px; border-radius:18px; overflow:hidden; }
.registry-execution-confirm__header { display:flex; align-items:center; gap:15px; padding:22px 24px; color:white; background:linear-gradient(115deg,#102c75 0%,#2357b0 100%); }
.registry-execution-confirm__icon { background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.18); display:grid; place-items:center; width:52px; height:52px; flex:none; border-radius:13px; }
.registry-execution-confirm__heading { min-width:0; flex:1; }
.registry-execution-confirm__heading h2 { font-size:21px; line-height:1.3; font-weight:800; margin:4px 0; }
.registry-execution-confirm__heading p { margin:0; color:#dce8ff; font-size:12px; }
.registry-execution-confirm__eyebrow { font-size:10px; letter-spacing:1.4px; font-weight:800; color:#c9dcff; }
.registry-execution-confirm__body { padding:23px 24px 12px; }
.registry-execution-confirm__intro { display:flex; align-items:flex-start; gap:10px; background:#eef4ff; border:1px solid #d8e5fb; color:#294c80; padding:13px; border-radius:11px; }
.registry-execution-confirm__intro .q-icon { flex:none; margin-top:2px; }
.registry-execution-confirm__intro p { margin:0; font-size:12px; line-height:1.65; }
.registry-execution-confirm__section-title { margin:20px 0 11px; font-weight:800; font-size:13px; color:#263c65; }
.registry-execution-confirm__docs { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
.registry-execution-confirm__doc { display:flex; align-items:center; gap:10px; background:#fff; border:1px solid #e0e7f2; border-radius:11px; padding:13px; min-width:0; }
.registry-execution-confirm__doc-icon { width:37px; height:37px; flex:none; border-radius:10px; background:#eaf0ff; color:#2959a8; display:grid; place-items:center; }
.registry-execution-confirm__doc>div:nth-child(2) { min-width:0; display:flex; flex-direction:column; gap:3px; }
.registry-execution-confirm__doc strong { font-size:11px; line-height:1.4; color:#283957; }
.registry-execution-confirm__doc span { color:#7a8ba7; font-size:10px; font-weight:700; }
.registry-execution-confirm__doc-mark { flex:none; color:#a9b9d2; margin-left:auto; }
.registry-execution-confirm__preview-note { display:flex; gap:9px; align-items:flex-start; padding:11px 12px; background:#fff8e8; border:1px solid #f1e2b9; color:#7a5c21; border-radius:9px; margin-top:15px; font-size:11px; line-height:1.6; }
.registry-execution-confirm__preview-note .q-icon { flex:none; }
.registry-execution-confirm__checkbox { margin:12px 0 3px; color:#344663; font-size:12px; align-items:flex-start; }
.registry-execution-confirm__footer { padding:13px 24px; gap:8px; }
@media (max-width:560px) { .registry-execution-confirm__header { padding:17px; } .registry-execution-confirm__body { padding:17px 17px 10px; } .registry-execution-confirm__docs { grid-template-columns:1fr; } .registry-execution-confirm__footer { padding:12px 17px; } .registry-execution-confirm__heading h2 { font-size:18px; } }
</style>

<style scoped>
/* ONE ICTMS task discipline and hierarchy details */
.scrum-planner__category { border-radius:5px; padding:4px 7px; background:#e8f3ff; color:#205b9b; font-size:10px; font-weight:800; }
.scrum-planner__category--backend { background:#e9f8f0; color:#137c52; }
.scrum-planner__category--db { background:#fff0dc; color:#9b6015; }
.scrum-planner__category--ui-ux { background:#f3eaff; color:#7847a3; }
.scrum-planner__trace { margin:10px 0 12px; display:grid; gap:7px; }
.scrum-planner__trace > div { display:grid; grid-template-columns:115px minmax(0,1fr); gap:9px; font-size:11px; line-height:1.5; }
.scrum-planner__trace b { color:#4f6590; }
.scrum-planner__trace span,.scrum-planner__planned-context { color:#697c95; overflow-wrap:anywhere; }
.scrum-planner__planned-context { font-size:11px; line-height:1.5; margin-bottom:7px; }
@media (max-width:550px) { .scrum-planner__trace > div { grid-template-columns:1fr; gap:1px; } }
</style>

<style scoped>
.scrum-planner__generated-heading { display:flex; align-items:center; gap:7px; color:#465b7b; font-size:11px; font-weight:700; }
.scrum-planner__assignment-state { display:flex; align-items:center; gap:5px; margin:4px 0 9px; color:#66758d; font-size:11px; }
.scrum-planner__module-group { display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px; }
.scrum-planner__module-heading { border: 1px solid #e3e8f1; border-radius: 10px; padding: 12px 14px; background: #fff; display: flex; flex-direction: column; gap: 9px; }
.scrum-planner__module-criterion { display: flex; align-items: flex-start; gap: 7px; font-size: 11px; font-weight: 700; color: #455570; line-height: 1.5; }
.scrum-planner__module-criterion span { font-weight: 400; color: #596984; }
.scrum-planner__module-title { display: flex; align-items: center; gap: 7px; font-size: 12px; color: #293b57; }
.scrum-planner__module-title span { margin-left: auto; color: #77849a; font-size: 11px; }
</style>

<style scoped>
.scrum-planner__trace-accordion { padding: 8px 12px; }
.scrum-planner__criterion-item { border: 1px solid #dbe2f0; border-radius: 10px; margin-bottom: 10px; background: #fff; overflow: hidden; }
.scrum-planner__criterion-body { padding: 8px 12px 16px; }
.scrum-planner__criterion-body .scrum-planner__module-group { margin-bottom: 16px; }
.scrum-planner__criterion-body .scrum-planner__task { margin-top: 10px; }
</style>

<style scoped>
/* Compact, always-visible generated tasks under each acceptance criterion. */
.scrum-planner__trace-task-row { border: 1px solid #dce4f1; border-radius: 9px; background: #fff; overflow: hidden; cursor: grab; }
.scrum-planner__trace-task-row + .scrum-planner__trace-task-row { margin-top: 6px; }
.scrum-planner__trace-task-heading { display: flex; flex-wrap: wrap; align-items: center; gap: 7px; min-width: 0; }
.scrum-planner__trace-task-code { font-size: 11px; font-weight: 800; color: #234ea2; border: 1px solid #d6e2f5; background: #eef4ff; padding: 3px 7px; border-radius: 5px; white-space: nowrap; }
.scrum-planner__trace-task-name { font-size: 12px; font-weight: 750; color: #263853; overflow-wrap: anywhere; }
.scrum-planner__trace-task-subtitle { display: flex; gap: 6px; margin-top: 3px; font-size: 10px; color: #73829a; }
.scrum-planner__trace-task-details { padding: 5px 13px 13px; border-top: 1px solid #eef1f6; }
.scrum-planner__trace-task-expand :deep(.q-item) { min-height: 44px; padding: 7px 10px; }
.scrum-planner__trace-task-expand :deep(.q-item__section--side) { padding-left: 6px; }
.scrum-planner__criterion-body .scrum-planner__module-group { gap: 5px; }
.scrum-planner__criterion-body .scrum-planner__module-heading { gap: 4px; padding: 9px 11px; }
</style>

<style scoped>

/* Stable visible task rows; no nested expansion-item layout or clipped badges. */
.scrum-planner__trace-accordion > .scrum-planner__criterion-item { flex-shrink: 0; }
.scrum-planner__criterion-body .scrum-planner__module-group { min-width: 0; flex-shrink: 0; gap: 6px; margin-bottom: 10px; }
.scrum-planner__criterion-body .scrum-planner__module-heading { padding: 9px 11px; gap: 4px; }
.scrum-planner__trace-task-row { display: block; flex: none; min-width: 0; overflow: visible; padding: 8px 10px; }
.scrum-planner__trace-task-toggle { display: flex; width: 100%; min-width: 0; align-items: center; flex-wrap: wrap; gap: 7px; padding: 0; border: 0; background: transparent; font: inherit; text-align: left; cursor: pointer; }
.scrum-planner__trace-task-toggle:focus-visible { outline: 2px solid #234ea2; outline-offset: 3px; border-radius: 4px; }
.scrum-planner__trace-task-name { flex: 1 1 160px; min-width: 0; }
.scrum-planner__trace-task-chevron { color: #73829a; margin-left: auto; flex-shrink: 0; }
.scrum-planner__trace-task-subtitle { margin: 4px 0 0; }
.scrum-planner__trace-task-details { margin-top: 9px; padding: 9px 2px 2px; }
</style>
