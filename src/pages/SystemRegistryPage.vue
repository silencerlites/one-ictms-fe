<template>
  <q-page class="registry-page workspace-page">
    <header class="registry-heading">
      <div class="section-kicker">WORKSPACE / SYSTEM REGISTRY</div>
      <h1>System Registry</h1>
      <p>Manage registered systems, departments, technology and repository records.</p>
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
        <div><h2>Registered Systems</h2><p>Live records from the ONE ICTMS Registry API.</p></div>
        <div class="registry-actions">
          <q-input v-model="search" dense outlined clearable placeholder="Search systems..." class="registry-search" aria-label="Search systems">
            <template #prepend><q-icon name="search" color="indigo-8" /></template>
          </q-input>
          <q-select v-model="statusFilter" dense outlined clearable emit-value map-options :options="statusOptions" label="Status" style="min-width:160px" />
          <q-btn flat round icon="refresh" :loading="loading" aria-label="Reload Registry" @click="void loadRegistries()" />
          <q-btn unelevated no-caps icon="add" label="Add System" class="registry-add" @click="openAddSystemChoice" />
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

    <q-dialog v-model="formOpen" persistent transition-show="scale" transition-hide="scale">
      <q-card class="registry-dialog registry-dialog--wide registry-dialog--editor">
        <q-card-section class="registry-wizard-header">
          <div class="registry-wizard-header__icon"><q-icon name="app_registration" size="26px" /></div>
          <div class="registry-wizard-header__copy">
            <div class="registry-wizard-header__eyebrow">SYSTEM REGISTRY / {{ editingId === null ? 'NEW SYSTEM' : 'EDIT SYSTEM' }}</div>
            <div class="text-h6 text-weight-bold">{{ editingId === null ? 'Register a system' : 'Update system details' }}</div>
            <div class="text-caption">Manage system information across six organized sections.</div>
          </div>
          <div class="registry-wizard-header__aside">
            <span class="registry-wizard-counter">Section {{ formStep }} of {{ stepLabels.length }}</span>
            <q-btn flat round icon="close" aria-label="Close registration" :disable="saving" @click="formOpen = false" />
          </div>
        </q-card-section>
        <div class="registry-wizard-progress" role="progressbar" :aria-valuenow="formStep" aria-valuemin="1" :aria-valuemax="stepLabels.length" aria-label="Registration section progress">
          <div class="registry-wizard-progress__fill" :style="{ width: `${(formStep / stepLabels.length) * 100}%` }"></div>
        </div>
        <q-form class="registry-wizard-form" @submit.prevent="void saveSystem()">
          <div class="registry-wizard-layout">
            <aside class="registry-wizard-sidebar" aria-label="Registration sections">
              <div class="registry-sidebar-title">REGISTRATION STEPS</div>
              <div class="registry-wizard-steps" aria-label="Registration progress">
              <button v-for="(label, index) in stepLabels" :key="label" type="button" class="registry-wizard-step"
                :class="{ 'is-current': formStep === index + 1, 'is-complete': formStep > index + 1 }"
                :aria-current="formStep === index + 1 ? 'step' : undefined"
                :disabled="saving" @click="goToStep(index + 1)">
                <span class="registry-wizard-step__number"><q-icon v-if="formStep > index + 1" name="check" size="14px" /><template v-else>{{ index + 1 }}</template></span>
                <span class="registry-wizard-step__label">{{ label }}</span>
                <q-icon v-if="formStep === index + 1" name="chevron_right" size="19px" class="registry-wizard-step__arrow" />
              </button>
              </div>
              <div class="registry-sidebar-hint"><q-icon name="tips_and_updates" size="19px" /><span>Choose any section to review your entries. Changes are saved when you submit.</span></div>
            </aside>
            <q-card-section class="registry-form registry-form--scroll registry-wizard-main">
              <div class="registry-wizard-section-meta"><span>{{ stepLabels[formStep - 1] }}</span><span>{{ formStep }} / {{ stepLabels.length }}</span></div>
            <q-banner v-if="library.errors.registryStatuses || library.registryStatuses.length === 0" rounded class="bg-orange-1 text-orange-10 q-mb-md">
              Registry Status options are not available. Check the Registry Status Library API and make sure active statuses have been seeded.
              <q-btn flat no-caps color="indigo-9" label="Reload Libraries" @click="void loadLibraries()" />
            </q-banner>
            <div v-show="formStep === 1" class="registry-wizard-content registry-profile-fields">
            <div class="registry-wizard-intro"><q-icon name="dns" size="25px" /><div><h3>System profile</h3><p>Identify the system and its owning department.</p></div></div>
            <q-input v-model.trim="form.system_name" outlined hide-bottom-space label="System name *" :rules="[requiredText]" />
            <div class="registry-form__grid registry-profile-fields__row">
              <q-input v-model.trim="form.alias" outlined label="Alias" />
              <q-select v-model="form.status" outlined hide-bottom-space label="Registry status *" :options="library.registryStatuses" option-label="name" option-value="id" emit-value map-options :rules="[requiredId]" :display-value="selectedStatusName" :disable="library.registryStatuses.length === 0" />
            </div>
            <q-input v-model.trim="form.description" type="textarea" autogrow outlined label="Description" />
            <q-select v-model="form.business_owner" outlined clearable label="Business owner (Department)" :options="departmentOptions" option-label="name" option-value="id" emit-value map-options />

            </div>
            <div v-show="formStep === 2" class="registry-wizard-content">
            <div class="registry-wizard-intro"><q-icon name="corporate_fare" size="25px" /><div><h3>Management & project details</h3><p>Specify responsible offices and project timelines.</p></div></div>
            <div class="registry-form__grid">
              <q-select v-model="form.desc.managing_type" outlined clearable label="Managing type" :options="library.managingTypes" option-label="name" option-value="id" emit-value map-options />
              <q-select v-model="form.desc.managing_office" outlined clearable label="Managing office (Department)" :options="departmentOptions" option-label="name" option-value="id" emit-value map-options />
              <q-input v-model.trim="form.desc.third_party_company" outlined label="Third-party company" />
              <q-input v-model.number="form.desc.estimation_project_duration" outlined type="number" min="0" label="Estimated duration (days)" />
              <q-input v-model="form.desc.project_roll_on" outlined type="date" label="Project roll-on" stack-label />
              <q-input v-model="form.desc.project_sign_off" outlined type="date" label="Project sign-off" stack-label />
            </div>

            </div>
            <div v-show="formStep === 3" class="registry-wizard-content">
            <div class="registry-wizard-intro"><q-icon name="description" size="25px" /><div><h3>Documents</h3><p>Associate existing files with this system registry.</p></div></div>
            <div class="registry-group-title row items-center justify-between">
              <span>Documents</span><q-btn flat no-caps dense icon="add" color="indigo-9" label="Add document" @click="form.docs.push({ docs_type: 0, file_path: '' })" />
            </div>
            <div v-for="(doc, index) in form.docs" :key="`document-${index}`" class="registry-form__grid registry-inline-row">
              <q-select v-model="doc.docs_type" outlined label="Document type *" :options="library.documentTypes" option-label="name" option-value="id" emit-value map-options :rules="[requiredId]" />
              <div class="row items-start no-wrap q-gutter-xs"><q-input v-model.trim="doc.file_path" class="col" outlined label="Stored file path *" :rules="[requiredText]" />
                <q-btn flat round icon="close" color="negative" @click="form.docs.splice(index, 1)" /></div>
            </div>
            <div class="text-caption text-grey-7">This saves existing file paths only; document uploads are handled separately.</div>
            </div>
            <div v-show="formStep === 4" class="registry-wizard-content">
            <div class="registry-wizard-intro"><q-icon name="groups" size="25px" /><div><h3>Stakeholders</h3><p>Assign system contacts from the Business Owner and Managing Office.</p></div></div>
            <q-banner v-if="auth.user && projectManagerRole" rounded class="bg-indigo-1 text-indigo-10 q-mb-md">
              <div class="row items-center q-gutter-sm">
                <q-icon name="verified_user" size="22px" />
                <div><strong>Automatic Project Manager</strong>
                  <div class="text-caption">{{ loggedInUserName }} (your signed-in account) is assigned as Project Manager when you register this system.</div>
                </div>
              </div>
            </q-banner>
            <div class="registry-group-title row items-center justify-between">
              <span>Assign stakeholders</span>
              <q-chip color="indigo-1" text-color="indigo-9" icon="people" dense>{{ form.stakeholders.length }} assigned</q-chip>
            </div>
            <div class="registry-stakeholder-toolbar q-mb-md">
              <q-input v-model="stakeholderSearch" outlined dense clearable placeholder="Search name or email..." class="registry-stakeholder-search">
                <template #prepend><q-icon name="search" /></template>
              </q-input>
            </div>
            <section v-for="group in stakeholderSections" :key="group.key" class="registry-stakeholder-section q-mb-md">
              <div class="registry-stakeholder-section__title">
                <div>
                  <strong>{{ group.title }}</strong>
                  <div class="text-caption text-grey-7">{{ group.departmentId != null ? departmentLabel(group.departmentId) : 'No department selected' }}</div>
                </div>
                <q-chip dense color="indigo-1" text-color="indigo-9">{{ group.users.length }} user(s)</q-chip>
              </div>
              <div v-if="group.departmentId == null" class="registry-stakeholder-empty">
                Select {{ group.title === 'Business Owner' ? 'a Business Owner' : 'a Managing Office' }} in the previous steps.
              </div>
              <div v-else-if="departmentUsersLoading && !departmentLoadedIds.includes(group.departmentId)" class="registry-stakeholder-empty row items-center justify-center q-gutter-sm">
                <q-spinner color="indigo-9" size="20px" /> Loading department users...
              </div>
              <div v-else-if="departmentErrors[group.departmentId]" class="registry-stakeholder-empty">
                <div class="text-negative q-mb-sm">{{ departmentErrors[group.departmentId] }}</div>
                <q-btn outline no-caps color="indigo-9" label="Retry loading users" @click="reloadDepartmentUsers" />
              </div>
              <div v-else-if="group.users.length === 0" class="registry-stakeholder-empty">
                {{ stakeholderSearch ? 'No users match your search in this department.' : 'The API returned 0 usable users for this department.' }}
                <div v-if="!stakeholderSearch" class="q-mt-sm text-caption">Confirm that the request uses this department ID and the response contains each user’s ID.</div>
                <q-btn v-if="!stakeholderSearch" flat no-caps color="indigo-9" icon="refresh" label="Reload department users" class="q-mt-sm" @click="reloadDepartmentUsers" />
              </div>
              <div v-else class="registry-assign-panel">
                <div class="registry-assign-panel__head">
                  <div><strong>Assign {{ group.title }} stakeholders</strong><p>Select a Stakeholder Type and check users from this department.</p></div>
                  <q-chip dense color="indigo-1" text-color="indigo-9">{{ sectionSelections[group.key].length }} selected</q-chip>
                </div>
                <div class="registry-assign-controls">
                  <q-select v-model="sectionRoles[group.key]" outlined dense clearable emit-value map-options
                    label="Stakeholder type for selected users *" :options="library.stakeholderTypes"
                    option-label="name" option-value="id" class="registry-assign-type" />
                  <q-btn unelevated no-caps color="indigo-9" icon="group_add"
                    :disable="sectionSelections[group.key].length === 0 || sectionRoles[group.key] == null || saving"
                    :label="`Assign ${sectionSelections[group.key].length} user${sectionSelections[group.key].length === 1 ? '' : 's'}`"
                    @click="assignSectionStakeholders(group.key)" />
                </div>
                <div class="registry-department-group__header">
                  <span>{{ group.users.length }} matching user(s)</span>
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
            <div v-if="!isInternallyManaged" class="text-caption text-grey-7 q-mb-md">
              Managing Office stakeholder assignment is available when Managing Type is Internally Managed.
            </div>
            <div v-if="stakeholderGroups.length" class="registry-assigned-groups">
              <div class="registry-group-title">Assigned stakeholder groups</div>
              <section v-for="group in stakeholderGroups" :key="group.id" class="registry-assigned-group">
                <div class="registry-assigned-group__header">
                  <strong>{{ group.name }}</strong>
                  <q-chip dense color="indigo-1" text-color="indigo-9">{{ group.users.length }} user(s)</q-chip>
                </div>
                <div v-for="user in group.users" :key="user.user_id" class="registry-assigned-user">
                  <q-icon name="person" color="indigo-8" size="19px" />
                  <span>{{ userDisplayName(user.user_id) }}</span>
                  <q-btn round dense flat icon="close" color="negative" aria-label="Remove assignment"
                    @click="removeStakeholder(user.user_id)" />
                </div>
              </section>
            </div>
            <div v-if="library.stakeholderTypes.length === 0" class="text-caption text-orange-9">
              Stakeholder types are not loaded. Check the Stakeholder Type Library before assigning users.
            </div>
            <div class="text-caption text-grey-7">
              Users are loaded from the Department Library. Select users, choose a Stakeholder Type, then Assign. Save the Registry to persist assignments.
            </div>

            </div>
            <div v-show="formStep === 5" class="registry-wizard-content">
            <div class="registry-wizard-intro"><q-icon name="memory" size="25px" /><div><h3>Technology used</h3><p>Document the frontend, backend, database, and server technologies.</p></div></div>
            <div class="registry-group-title">Technology stack</div>
            <div class="registry-form__grid">
              <q-select v-model="form.tech_stack.frontend_stack" multiple use-chips outlined clearable label="Frontend technologies" :options="library.techStacks" :option-label="techLabel" option-value="id" emit-value map-options />
              <q-select v-model="form.tech_stack.backend_stack" multiple use-chips outlined clearable label="Backend technologies" :options="library.techStacks" :option-label="techLabel" option-value="id" emit-value map-options />
              <q-input v-model.trim="form.tech_stack.database" outlined label="Database" />
              <q-input v-model.trim="form.tech_stack.server_type" outlined label="Server type" />
              <q-input v-model.trim="form.tech_stack.server_name" outlined label="Server name" />
            </div>

            </div>
            <div v-show="formStep === 6" class="registry-wizard-content">
            <div class="registry-wizard-intro"><q-icon name="source" size="25px" /><div><h3>Repository</h3><p>Connect the system repository and deployment URLs.</p></div></div>
            <q-select v-model="form.repo.development_solution_type" outlined clearable label="Development solution type" :options="library.developmentSolutionTypes" option-label="name" option-value="id" emit-value map-options />
            <q-input v-model.trim="form.repo.repo_git" outlined label="Git repository URL" />
            <div class="registry-form__grid">
              <q-input v-model.trim="form.repo.staging_url" outlined label="Staging URL" />
              <q-input v-model.trim="form.repo.production_url" outlined label="Production URL" />
            </div>

            </div>
            </q-card-section>
          </div>
          <q-separator />
          <q-card-actions align="right" class="registry-wizard-footer q-pa-md">
            <q-btn flat no-caps label="Cancel" :disable="saving" @click="formOpen = false" />
            <div class="registry-footer-current q-mr-auto"><q-icon name="edit_note" size="19px" /> {{ stepLabels[formStep - 1] }}</div>
            <q-btn v-if="formStep > 1" flat no-caps icon="arrow_back" label="Back" :disable="saving" @click="formStep--" />
            <q-btn v-if="formStep < stepLabels.length" unelevated no-caps color="indigo-9" icon-right="arrow_forward" label="Next" :disable="saving" @click="nextStep" />
            <q-btn v-else unelevated no-caps type="submit" color="indigo-9" :loading="saving" :label="editingId === null ? 'Register System' : 'Save Changes'" />
          </q-card-actions>
        </q-form>
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
import { useQuasar, type QTableColumn } from 'quasar'
import { registryApi } from '@/services/registry-api'
import { useLibraryStore } from '@/stores/library'
import { useAuthStore } from '@/stores/auth'
import { errorMessage } from '@/services/http'
import { libraryApi, type DepartmentUser, type LibraryOption } from '@/services/library-api'
import type { RegistryPayload, RegistryRecord } from '@/types/registry'

type RegistryForm = Omit<RegistryPayload, 'status' | 'desc' | 'repo' | 'tech_stack' | 'stakeholders' | 'docs'> & {
  status: number | null
  desc: NonNullable<RegistryPayload['desc']>
  repo: NonNullable<RegistryPayload['repo']>
  tech_stack: NonNullable<RegistryPayload['tech_stack']>
  stakeholders: NonNullable<RegistryPayload['stakeholders']>
  docs: NonNullable<RegistryPayload['docs']>
}

const $q = useQuasar()
const library = useLibraryStore()
const auth = useAuthStore()
const systems = ref<RegistryRecord[]>([])
const selected = ref<RegistryRecord | null>(null)
const search = ref('')
const statusFilter = ref<number | null>(null)
const loading = ref(false)
const loadError = ref('')
const saving = ref(false)
const formOpen = ref(false)
const formStep = ref(1)
const stepLabels = ['System Profile', 'Management', 'Documents', 'Stakeholders', 'Technology Used', 'Repository']
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
type StakeholderUser = { id: number; name: string; email: string | null; departmentIds: number[] }
type StakeholderSectionKey = 'owner' | 'office'
const departmentUsersLoading = ref(false)
const departmentDirectory = ref<Record<number, DepartmentUser[]>>({})
const departmentErrors = ref<Record<number, string>>({})
const departmentLoadedIds = ref<number[]>([])
let departmentRequestVersion = 0
const isInternallyManaged = computed(() => {
  const type = library.managingTypes.find(item => Number(item.id) === Number(form.value.desc.managing_type))
  if (!type || form.value.desc.managing_type == null) return false
  return /\binternal(?:ly)?\b/i.test(`${type.name} ${type.alias ?? ''}`)
})
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
const stakeholderSearch = ref('')
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
  const term = stakeholderSearch.value?.trim().toLowerCase() ?? ''
  const sections: { key: StakeholderSectionKey; title: string; departmentId: number | null; users: StakeholderUser[] }[] = [
    { key: 'owner', title: 'Business Owner', departmentId: form.value.business_owner ?? null, users: [] },
  ]
  if (isInternallyManaged.value) sections.push({ key: 'office', title: 'Managing Office', departmentId: form.value.desc.managing_office ?? null, users: [] })
  return sections.map(section => ({
    ...section,
    users: departmentUsers.value.filter(user => section.departmentId != null && user.departmentIds.includes(section.departmentId) &&
      (!term || `${user.name} ${user.email ?? ''}`.toLowerCase().includes(term))),
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
const stakeholderGroups = computed(() => library.stakeholderTypes
  .map(role => ({
    id: Number(role.id), name: role.name,
    users: form.value.stakeholders.filter(item => Number(item.stakeholder_type) === Number(role.id)),
  }))
  .filter(group => group.users.length > 0))
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
    repo: { development_solution_type: null, repo_git: null, staging_url: null, production_url: null },
    tech_stack: { frontend_stack: [], backend_stack: [], database: null, server_type: null, server_name: null },
    stakeholders: [], docs: [],
  }
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
  const total = systems.value.length
  const countByWord = (part: string) => systems.value.filter(item => statusLabel(item.status).toLowerCase().includes(part)).length
  return [
    { label: 'TOTAL SYSTEMS', count: total, description: 'All registered systems', icon: 'dns', theme: 'total' },
    { label: 'ACTIVE SYSTEMS', count: systems.value.filter(item => statusLabel(item.status).toLowerCase() === 'active').length, description: 'Active status', icon: 'check_circle', theme: 'active' },
    { label: 'UNDER REVIEW', count: countByWord('review'), description: 'Review status', icon: 'schedule', theme: 'review' },
    { label: 'ARCHIVED SYSTEMS', count: countByWord('archiv'), description: 'Archived status', icon: 'inventory_2', theme: 'archived' },
  ]
})
const columns: QTableColumn<RegistryRecord>[] = [
  { name: 'system_name', label: 'SYSTEM NAME', field: 'system_name', align: 'left', sortable: true },
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
  return lower.includes('review') ? 'is-review' : lower.includes('archiv') || lower.includes('retir') ? 'is-archived' : ''
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
  // Render the dialog immediately: do not block opening on seven library requests.
  editingId.value = null
  form.value = emptyForm()
  stakeholderSearch.value = ''
  sectionSelections.value = { owner: [], office: [] }
  sectionRoles.value = { owner: null, office: null }
  formStep.value = 1
  formOpen.value = true
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
    const blank = emptyForm()
    form.value = {
      ...blank,
      system_name: item.system_name,
      alias: item.alias ?? '',
      description: item.description ?? '',
      business_owner: item.business_owner ?? null,
      status: item.status,
      desc: { ...blank.desc, ...(item.desc ?? {}) },
      repo: { ...blank.repo, ...(item.repo ?? {}) },
      tech_stack: { ...blank.tech_stack, ...(item.tech_stack ?? {}), frontend_stack: [...(item.tech_stack?.frontend_stack ?? [])], backend_stack: [...(item.tech_stack?.backend_stack ?? [])] },
      stakeholders: (item.stakeholders ?? []).map(i => ({ user_id: i.user_id, stakeholder_type: i.stakeholder_type })),
      docs: (item.docs ?? []).map(i => ({ docs_type: i.docs_type, file_path: i.file_path })),
    }
    editingId.value = id
    stakeholderSearch.value = ''
    sectionSelections.value = { owner: [], office: [] }
    sectionRoles.value = { owner: null, office: null }
    formStep.value = 1
    formOpen.value = true
    void autoAssignProjectManager()
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
    repo: (
      value.repo.development_solution_type != null ||
      Boolean(value.repo.repo_git?.trim()) ||
      Boolean(value.repo.staging_url?.trim()) ||
      Boolean(value.repo.production_url?.trim())
    ) ? {
      development_solution_type: value.repo.development_solution_type ?? null,
      repo_git: optionalText(value.repo.repo_git), staging_url: optionalText(value.repo.staging_url), production_url: optionalText(value.repo.production_url),
    } : null,
    tech_stack: {
      frontend_stack: value.tech_stack.frontend_stack ?? [], backend_stack: value.tech_stack.backend_stack ?? [],
      database: optionalText(value.tech_stack.database), server_type: optionalText(value.tech_stack.server_type), server_name: optionalText(value.tech_stack.server_name),
    },
    stakeholders: value.stakeholders.map(item => ({ user_id: Number(item.user_id), stakeholder_type: Number(item.stakeholder_type) })),
    docs: value.docs.map(item => ({ docs_type: Number(item.docs_type), file_path: item.file_path.trim() })),
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
function goToStep(target: number): void {
  if (saving.value || target < 1 || target > stepLabels.length || target === formStep.value) return
  // Users may jump backward freely; a required Profile must be valid to skip forward.
  if (target > 1 && !validProfile()) { formStep.value = 1; return }
  formStep.value = target
}
function nextStep(): void {
  goToStep(formStep.value + 1)
}
async function saveSystem(): Promise<void> {
  if (!form.value.system_name.trim() || form.value.status === null ||
      !library.registryStatuses.some(item => Number(item.id) === Number(form.value.status))) {
    formStep.value = 1
    $q.notify({ type: 'warning', message: 'Complete the required System Profile fields.' })
    return
  }
  saving.value = true
  try {
    if (editingId.value === null && !await autoAssignProjectManager()) return
    if (form.value.stakeholders.some(item => !item.stakeholder_type || !library.stakeholderTypes.some(t => Number(t.id) === Number(item.stakeholder_type)))) {
      formStep.value = 4
      $q.notify({ type: 'warning', message: 'Assign a valid stakeholder role to every selected user.' })
      return
    }
    const payload = payloadForSave()
    const response = editingId.value === null ? await registryApi.create(payload) : await registryApi.update(editingId.value, payload)
    if (!response.success) throw new Error(response.message || 'Failed to save registry')
    formOpen.value = false
    $q.notify({ type: 'positive', message: editingId.value === null ? 'System registered successfully.' : 'System updated successfully.' })
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
.registry-wizard-header__copy .text-caption{color:#75819e}
.registry-wizard-header__eyebrow{font-size:10px;font-weight:800;letter-spacing:.13em;color:#5152a5;margin-bottom:2px}
.registry-wizard-steps{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px;margin:0 0 20px}
.registry-wizard-step{display:flex;align-items:center;text-align:left;gap:10px;padding:13px 10px;background:#f6f7fb;border:1px solid #e3e6f0;border-radius:12px;color:#67738f;font-size:12px;font-weight:750;min-width:0;cursor:pointer;transition:background .16s,border-color .16s,box-shadow .16s;font-family:inherit}
.registry-wizard-step:hover:not(:disabled){background:#ebedff;border-color:#a6a9e5}
.registry-wizard-step:focus-visible{outline:3px solid #9c9ff0;outline-offset:2px}
.registry-wizard-step:disabled{opacity:.55;cursor:not-allowed}
.registry-wizard-step__label{line-height:1.35;flex:1;min-width:0}
.registry-wizard-step__arrow{flex:none}
.registry-wizard-step.is-current{background:#eeefff;border-color:#494ba9;color:#282b89;box-shadow:0 0 0 1px #494ba9 inset}
.registry-wizard-step.is-complete{color:#3f449b;border-color:#d3d6ef;background:#f8f8ff}
.registry-wizard-intro{display:flex;align-items:center;gap:13px;padding:14px 16px;background:#f6f7fd;border:1px solid #e6e8f4;border-radius:13px;color:#30349a;margin-bottom:6px}
.registry-wizard-intro h3{font-size:15px;line-height:1.35;font-weight:800;margin:0 0 2px}
.registry-wizard-intro p{font-size:12px;line-height:1.45;color:#74819d;margin:0}
.registry-wizard-content{display:flex;flex-direction:column;gap:12px;min-height:215px}
@media(max-width:700px){.registry-wizard-steps{grid-template-columns:repeat(2,minmax(0,1fr))}.registry-wizard-header{padding:15px}.registry-wizard-header__icon{width:42px;height:42px}.registry-wizard-step{padding:10px 8px}}
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
.registry-wizard-step__number{width:29px;height:29px;flex:none;display:grid;place-items:center;background:white;border:1px solid #dfe3f2;border-radius:9px;font-size:12px;font-weight:850;color:#7984a5}
.registry-wizard-step.is-current .registry-wizard-step__number{background:#4547b9;color:white;border-color:#4547b9}
.registry-wizard-step.is-complete .registry-wizard-step__number{background:#def4e9;color:#19825b;border-color:#cce9da}
.registry-sidebar-hint{margin-top:auto;display:flex;align-items:flex-start;gap:10px;background:#fff;border:1px solid #e7eafa;color:#7d89a3;padding:13px;border-radius:13px;font-size:11px;line-height:1.5}
.registry-sidebar-hint .q-icon{color:#7476c6;flex:none}
.registry-dialog--editor .registry-wizard-main{padding:26px clamp(22px,3.1vw,48px) 40px;max-height:none;min-height:0;overflow-y:auto;overscroll-behavior:contain;gap:16px;background:#fff}
.registry-wizard-section-meta{display:flex;justify-content:space-between;align-items:center;font-size:11px;letter-spacing:.06em;font-weight:850;text-transform:uppercase;color:#808ba6}
.registry-wizard-section-meta span:last-child{letter-spacing:0;background:#f0f1fa;color:#565ba9;padding:6px 10px;border-radius:8px}
.registry-dialog--editor .registry-wizard-content{gap:19px;min-height:270px}
.registry-dialog--editor .registry-wizard-intro{padding:20px;border-radius:16px;background:linear-gradient(105deg,#f0f1ff,#fafbff);border-color:#e5e7fc;gap:17px}
.registry-dialog--editor .registry-wizard-intro > .q-icon{background:white;border-radius:13px;padding:12px;box-sizing:content-box}
.registry-dialog--editor .registry-wizard-intro h3{font-size:19px;margin-bottom:5px}
.registry-dialog--editor .registry-wizard-intro p{font-size:13px}
.registry-dialog--editor .registry-form__grid{gap:16px}
/* System Profile: evenly spaced controls without Quasar's unused validation-footer height. */
.registry-dialog--editor .registry-profile-fields{gap:18px}
.registry-dialog--editor .registry-profile-fields__row{gap:18px;align-items:start}
.registry-dialog--editor .registry-profile-fields > .q-field,
.registry-dialog--editor .registry-profile-fields__row > .q-field{min-width:0;width:100%}

.registry-wizard-footer{background:white;flex-shrink:0;min-height:77px;gap:12px;padding:14px 25px!important}
.registry-wizard-footer .q-btn{border-radius:10px;min-height:42px;padding-left:17px;padding-right:17px}
.registry-footer-current{display:flex;align-items:center;gap:7px;color:#74809e;font-size:12px;font-weight:700}
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
